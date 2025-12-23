import { Board, Player, PieceType } from './Board'
import { Move, MoveValidator, MoveType, PieceMove } from './Move'
import { Minimax } from '../ai/Minimax'
import { Precog, FutureVision } from '../ai/Precog'

export enum GameStatus {
  Active = 'active',
  RedWins = 'red_wins',
  BlackWins = 'black_wins',
  Draw = 'draw',
}

export interface MoveRecord {
  player: Player
  from: { row: number; col: number }
  to: { row: number; col: number }
  captured?: { row: number; col: number }
  wasPromotion: boolean
}

export class GameState {
  board: Board
  currentPlayer: Player
  status: GameStatus
  selectedPiece: { row: number; col: number } | null
  validMoves: Move[]
  moveHistory: MoveRecord[]
  humanPlayer: Player
  aiPlayer: Player
  aiDepth: number
  visionsEnabled: boolean
  currentVisions: FutureVision[]
  lastAIMove: { row: number; col: number } | null

  private onUpdate: (() => void) | null = null
  private onAIThinking: ((thinking: boolean) => void) | null = null

  constructor(humanPlayer: Player = Player.Red, aiDepth: number = 5) {
    this.board = new Board()
    this.currentPlayer = Player.Red
    this.status = GameStatus.Active
    this.selectedPiece = null
    this.validMoves = []
    this.moveHistory = []
    this.humanPlayer = humanPlayer
    this.aiPlayer = humanPlayer === Player.Red ? Player.Black : Player.Red
    this.aiDepth = aiDepth
    this.visionsEnabled = true
    this.currentVisions = []
    this.lastAIMove = null
  }

  setUpdateCallback(callback: () => void): void {
    this.onUpdate = callback
  }

  setAIThinkingCallback(callback: (thinking: boolean) => void): void {
    this.onAIThinking = callback
  }

  selectPiece(row: number, col: number): boolean {
    if (this.status !== GameStatus.Active) return false
    if (this.currentPlayer !== this.humanPlayer) return false

    const piece = this.board.getPieceAt(row, col)
    if (!piece || piece.player !== this.currentPlayer) {
      this.selectedPiece = null
      this.validMoves = []
      this.triggerUpdate()
      return false
    }

    // Check if this piece has valid moves
    const allMoves = MoveValidator.getAllValidMoves(this.board, this.currentPlayer)
    const pieceMoves = allMoves.filter(m => m.fromRow === row && m.fromCol === col)

    if (pieceMoves.length === 0) {
      this.selectedPiece = null
      this.validMoves = []
      this.triggerUpdate()
      return false
    }

    this.selectedPiece = { row, col }
    this.validMoves = pieceMoves.map(m => m.move)

    // Update visions for this piece
    if (this.visionsEnabled) {
      this.updateVisions()
    }

    this.triggerUpdate()
    return true
  }

  makeMove(toRow: number, toCol: number): boolean {
    if (!this.selectedPiece) return false
    if (this.status !== GameStatus.Active) return false
    if (this.currentPlayer !== this.humanPlayer) return false

    const move = this.validMoves.find(m => m.toRow === toRow && m.toCol === toCol)
    if (!move) return false

    // Clear AI move highlight when human moves
    this.lastAIMove = null

    this.executeMove(this.selectedPiece.row, this.selectedPiece.col, move)
    return true
  }

  private executeMove(fromRow: number, fromCol: number, move: Move): void {
    const piece = this.board.getPieceAt(fromRow, fromCol)
    if (!piece) return

    const wasKing = piece.type === PieceType.King

    // Record the move
    const record: MoveRecord = {
      player: this.currentPlayer,
      from: { row: fromRow, col: fromCol },
      to: { row: move.toRow, col: move.toCol },
      wasPromotion: false,
    }

    if (move.type === MoveType.Capture && move.capturedRow !== undefined) {
      record.captured = { row: move.capturedRow, col: move.capturedCol! }
    }

    // Execute the move
    Move.execute(this.board, fromRow, fromCol, move)

    // Check for promotion
    const movedPiece = this.board.getPieceAt(move.toRow, move.toCol)
    if (movedPiece && !wasKing && movedPiece.type === PieceType.King) {
      record.wasPromotion = true
    }

    this.moveHistory.push(record)

    // Check for multi-jump
    if (move.type === MoveType.Capture) {
      const chains = MoveValidator.getCaptureChains(this.board, move.toRow, move.toCol)
      if (chains.some(c => c.length > 0)) {
        // More captures available - stay on this piece
        this.selectedPiece = { row: move.toRow, col: move.toCol }
        this.validMoves = MoveValidator.getValidMoves(this.board, move.toRow, move.toCol)
          .filter(m => m.type === MoveType.Capture)
        this.triggerUpdate()
        return
      }
    }

    // Switch turns
    this.selectedPiece = null
    this.validMoves = []
    this.currentVisions = []
    this.switchTurn()
  }

  private switchTurn(): void {
    this.currentPlayer = this.currentPlayer === Player.Red ? Player.Black : Player.Red
    this.checkGameOver()

    if (this.status === GameStatus.Active && this.currentPlayer === this.aiPlayer) {
      this.triggerUpdate()
      this.makeAIMove()
    } else {
      this.triggerUpdate()
    }
  }

  private async makeAIMove(): Promise<void> {
    this.onAIThinking?.(true)

    // Small delay to let UI update
    await new Promise(resolve => setTimeout(resolve, 300))

    const result = Minimax.findBestMove(this.board, this.aiPlayer, this.aiDepth)

    this.onAIThinking?.(false)

    if (result) {
      const record: MoveRecord = {
        player: this.aiPlayer,
        from: { row: result.fromRow, col: result.fromCol },
        to: { row: result.move.toRow, col: result.move.toCol },
        wasPromotion: false,
      }

      if (result.move.type === MoveType.Capture && result.move.capturedRow !== undefined) {
        record.captured = { row: result.move.capturedRow, col: result.move.capturedCol! }
      }

      const piece = this.board.getPieceAt(result.fromRow, result.fromCol)
      const wasKing = piece?.type === PieceType.King

      Move.execute(this.board, result.fromRow, result.fromCol, result.move)

      const movedPiece = this.board.getPieceAt(result.move.toRow, result.move.toCol)
      if (movedPiece && !wasKing && movedPiece.type === PieceType.King) {
        record.wasPromotion = true
      }

      this.moveHistory.push(record)

      // Handle multi-jump for AI
      let finalPos = { row: result.move.toRow, col: result.move.toCol }
      if (result.move.type === MoveType.Capture) {
        let currentPos = { row: result.move.toRow, col: result.move.toCol }
        let moreCapturesLoop = true

        while (moreCapturesLoop) {
          const captures = MoveValidator.getValidMoves(this.board, currentPos.row, currentPos.col)
            .filter(m => m.type === MoveType.Capture)

          if (captures.length > 0) {
            const nextCapture = captures[0]
            Move.execute(this.board, currentPos.row, currentPos.col, nextCapture)

            this.moveHistory.push({
              player: this.aiPlayer,
              from: currentPos,
              to: { row: nextCapture.toRow, col: nextCapture.toCol },
              captured: { row: nextCapture.capturedRow!, col: nextCapture.capturedCol! },
              wasPromotion: false,
            })

            currentPos = { row: nextCapture.toRow, col: nextCapture.toCol }
            finalPos = currentPos
          } else {
            moreCapturesLoop = false
          }
        }
      }

      // Track the AI's last move for visual feedback
      this.lastAIMove = finalPos

      this.switchTurn()
    } else {
      // AI has no moves - game over
      this.checkGameOver()
      this.triggerUpdate()
    }
  }

  private checkGameOver(): void {
    const redPieces = this.board.getPieces(Player.Red)
    const blackPieces = this.board.getPieces(Player.Black)

    if (redPieces.length === 0) {
      this.status = GameStatus.BlackWins
      return
    }

    if (blackPieces.length === 0) {
      this.status = GameStatus.RedWins
      return
    }

    const currentMoves = MoveValidator.getAllValidMoves(this.board, this.currentPlayer)
    if (currentMoves.length === 0) {
      this.status = this.currentPlayer === Player.Red ? GameStatus.BlackWins : GameStatus.RedWins
    }
  }

  private updateVisions(): void {
    if (!this.selectedPiece || !this.visionsEnabled) {
      this.currentVisions = []
      return
    }

    const pieceMove: PieceMove = {
      fromRow: this.selectedPiece.row,
      fromCol: this.selectedPiece.col,
      move: this.validMoves[0],
    }

    // Get visions for current position
    this.currentVisions = Precog.getFutures(this.board, this.humanPlayer, 3, 3)
  }

  toggleVisions(): void {
    this.visionsEnabled = !this.visionsEnabled
    if (!this.visionsEnabled) {
      this.currentVisions = []
    } else if (this.selectedPiece) {
      this.updateVisions()
    }
    this.triggerUpdate()
  }

  newGame(): void {
    this.board = new Board()
    this.currentPlayer = Player.Red
    this.status = GameStatus.Active
    this.selectedPiece = null
    this.validMoves = []
    this.moveHistory = []
    this.currentVisions = []
    this.lastAIMove = null
    this.triggerUpdate()
  }

  startWithPlayer(humanGoesFirst: boolean): void {
    // Set the human player based on who goes first
    // Red always moves first, so if human goes first, human is Red
    this.humanPlayer = humanGoesFirst ? Player.Red : Player.Black
    this.aiPlayer = humanGoesFirst ? Player.Black : Player.Red

    this.newGame()

    // If AI goes first, trigger AI move
    if (this.currentPlayer === this.aiPlayer) {
      this.makeAIMove()
    }
  }

  start(): void {
    // Called after callbacks are set up to trigger AI if it goes first
    if (this.currentPlayer === this.aiPlayer && this.status === GameStatus.Active) {
      this.makeAIMove()
    }
  }

  private triggerUpdate(): void {
    this.onUpdate?.()
  }
}
