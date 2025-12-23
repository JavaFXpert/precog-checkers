import { Board, Player, PieceType } from '../game/Board'
import { GameState, GameStatus, MoveRecord } from '../game/GameState'
import { Move, MoveType } from '../game/Move'
import { FutureVision } from '../ai/Precog'

export class Renderer {
  private boardElement: HTMLElement
  private currentTurnElement: HTMLElement
  private gameStatusElement: HTMLElement
  private visionsContainer: HTMLElement
  private threatContainer: HTMLElement
  private historyContainer: HTMLElement
  private newGameBtn: HTMLElement
  private toggleVisionsBtn: HTMLElement

  constructor(private gameState: GameState) {
    this.boardElement = document.getElementById('board')!
    this.currentTurnElement = document.getElementById('current-turn')!
    this.gameStatusElement = document.getElementById('game-status')!
    this.visionsContainer = document.getElementById('visions-container')!
    this.threatContainer = document.getElementById('threat-container')!
    this.historyContainer = document.getElementById('history-container')!
    this.newGameBtn = document.getElementById('new-game-btn')!
    this.toggleVisionsBtn = document.getElementById('toggle-visions-btn')!

    this.setupEventListeners()
    this.render()
  }

  private setupEventListeners(): void {
    this.newGameBtn.addEventListener('click', () => {
      this.showStartModal()
    })

    this.toggleVisionsBtn.addEventListener('click', () => {
      this.gameState.toggleVisions()
    })
  }

  showStartModal(): void {
    let existingModal = document.querySelector('.start-modal')
    if (existingModal) {
      existingModal.remove()
    }

    const modal = document.createElement('div')
    modal.className = 'game-over-modal active'

    modal.innerHTML = `
      <h2 class="game-over-title">PRECOG CHECKERS</h2>
      <p class="game-over-message">Who should make the first move?</p>
      <div class="start-buttons">
        <button class="holo-button" id="human-first-btn">I GO FIRST</button>
        <button class="holo-button" id="computer-first-btn">COMPUTER FIRST</button>
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById('human-first-btn')!.addEventListener('click', () => {
      modal.remove()
      this.gameState.startWithPlayer(true)
    })

    document.getElementById('computer-first-btn')!.addEventListener('click', () => {
      modal.remove()
      this.gameState.startWithPlayer(false)
    })
  }

  render(): void {
    this.renderBoard()
    this.renderHUD()
    this.renderVisions()
    this.renderThreats()
    this.renderHistory()
    this.checkGameOver()
  }

  private renderBoard(): void {
    this.boardElement.innerHTML = ''

    // Flip board so human pieces are always at the bottom
    const flipBoard = this.gameState.humanPlayer === Player.Red

    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        // Convert display coordinates to game coordinates
        const row = flipBoard ? 7 - displayRow : displayRow
        const col = flipBoard ? 7 - displayCol : displayCol

        const square = document.createElement('div')
        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`
        square.dataset.row = row.toString()
        square.dataset.col = col.toString()

        // Check if this is the selected piece
        if (
          this.gameState.selectedPiece &&
          this.gameState.selectedPiece.row === row &&
          this.gameState.selectedPiece.col === col
        ) {
          square.classList.add('selected')
        }

        // Check if this is a valid move target
        const isValidMove = this.gameState.validMoves.some(
          m => m.toRow === row && m.toCol === col
        )
        if (isValidMove) {
          square.classList.add('valid-move')

          // Check if it's a capture move
          const captureMove = this.gameState.validMoves.find(
            m => m.toRow === row && m.toCol === col && m.type === MoveType.Capture
          )
          if (captureMove) {
            square.classList.add('capture-target')
          }
        }

        // Add piece if present
        const piece = this.gameState.board.getPieceAt(row, col)
        if (piece) {
          const pieceElement = document.createElement('div')
          pieceElement.className = `piece ${piece.player}`
          if (piece.type === PieceType.King) {
            pieceElement.classList.add('king')
          }
          square.appendChild(pieceElement)
        }

        // Add click handler
        square.addEventListener('click', () => this.handleSquareClick(row, col))

        this.boardElement.appendChild(square)
      }
    }
  }

  private handleSquareClick(row: number, col: number): void {
    // If clicking on a valid move target, make the move
    if (this.gameState.validMoves.some(m => m.toRow === row && m.toCol === col)) {
      this.gameState.makeMove(row, col)
      return
    }

    // Otherwise, try to select a piece
    this.gameState.selectPiece(row, col)
  }

  private renderHUD(): void {
    const turn = this.gameState.currentPlayer === Player.Red ? 'RED' : 'BLACK'
    this.currentTurnElement.textContent = turn
    this.currentTurnElement.className = `hud-value ${this.gameState.currentPlayer}`

    let statusText = 'ACTIVE'
    switch (this.gameState.status) {
      case GameStatus.RedWins:
        statusText = 'RED WINS'
        break
      case GameStatus.BlackWins:
        statusText = 'BLACK WINS'
        break
      case GameStatus.Draw:
        statusText = 'DRAW'
        break
    }
    this.gameStatusElement.textContent = statusText
  }

  private renderVisions(): void {
    if (!this.gameState.visionsEnabled || this.gameState.currentVisions.length === 0) {
      this.visionsContainer.innerHTML = `
        <div class="vision-placeholder">
          <p>${this.gameState.visionsEnabled ? 'Select a piece to see possible futures...' : 'Visions disabled'}</p>
        </div>
      `
      return
    }

    this.visionsContainer.innerHTML = this.gameState.currentVisions
      .map((vision, index) => {
        const scoreClass = vision.evaluation > 50 ? 'best' : vision.evaluation < -50 ? 'danger' : ''
        return `
          <div class="vision-card ${scoreClass}" data-vision-index="${index}">
            <div class="vision-title">FUTURE ${index + 1}</div>
            <div class="vision-description">${vision.description}</div>
            <div class="vision-score">Evaluation: ${vision.evaluation > 0 ? '+' : ''}${vision.evaluation}</div>
          </div>
        `
      })
      .join('')
  }

  private renderThreats(): void {
    // Analyze current threats
    const threats: { level: string; message: string }[] = []

    if (this.gameState.status !== GameStatus.Active) {
      threats.push({ level: 'safe', message: 'Game Over' })
    } else if (this.gameState.currentPlayer === this.gameState.aiPlayer) {
      threats.push({ level: 'warning', message: 'AI is thinking...' })
    } else {
      // Check if any of player's pieces are under threat
      const playerPieces = this.gameState.board.getPieces(this.gameState.humanPlayer)
      const opponentMoves = this.getAllCaptureMoves(this.gameState.aiPlayer)

      const threatenedPieces = playerPieces.filter(p =>
        opponentMoves.some(m => m.capturedRow === p.row && m.capturedCol === p.col)
      )

      if (threatenedPieces.length > 0) {
        threats.push({
          level: 'danger',
          message: `${threatenedPieces.length} piece(s) in danger!`,
        })
      }

      // Check piece advantage
      const playerCount = this.gameState.board.getPieces(this.gameState.humanPlayer).length
      const opponentCount = this.gameState.board.getPieces(this.gameState.aiPlayer).length

      if (playerCount > opponentCount) {
        threats.push({ level: 'safe', message: `Advantage: +${playerCount - opponentCount} pieces` })
      } else if (playerCount < opponentCount) {
        threats.push({
          level: 'warning',
          message: `Disadvantage: ${playerCount - opponentCount} pieces`,
        })
      }

      if (threats.length === 0) {
        threats.push({ level: 'safe', message: 'No immediate threats detected' })
      }
    }

    this.threatContainer.innerHTML = threats
      .map(
        t => `
        <div class="threat-item ${t.level}">
          <span class="threat-icon">&#9679;</span>
          <span class="threat-text">${t.message}</span>
        </div>
      `
      )
      .join('')
  }

  private getAllCaptureMoves(player: Player): Move[] {
    const pieces = this.gameState.board.getPieces(player)
    const captures: Move[] = []

    for (const { row, col } of pieces) {
      const moves = this.getCaptureMoves(row, col, player)
      captures.push(...moves)
    }

    return captures
  }

  private getCaptureMoves(row: number, col: number, player: Player): Move[] {
    const piece = this.gameState.board.getPieceAt(row, col)
    if (!piece || piece.player !== player) return []

    const directions = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]
    const captures: Move[] = []

    for (const [dr, dc] of directions) {
      const jumpedRow = row + dr
      const jumpedCol = col + dc
      const landRow = row + 2 * dr
      const landCol = col + 2 * dc

      if (landRow < 0 || landRow >= 8 || landCol < 0 || landCol >= 8) continue

      const jumpedPiece = this.gameState.board.getPieceAt(jumpedRow, jumpedCol)
      const landSquare = this.gameState.board.getPieceAt(landRow, landCol)

      if (jumpedPiece && jumpedPiece.player !== player && !landSquare) {
        captures.push({
          toRow: landRow,
          toCol: landCol,
          type: MoveType.Capture,
          capturedRow: jumpedRow,
          capturedCol: jumpedCol,
        })
      }
    }

    return captures
  }

  private renderHistory(): void {
    if (this.gameState.moveHistory.length === 0) {
      this.historyContainer.innerHTML = '<p class="history-placeholder">No moves yet...</p>'
      return
    }

    const recentMoves = this.gameState.moveHistory.slice(-10).reverse()
    this.historyContainer.innerHTML = recentMoves
      .map((move, index) => {
        const moveNum = this.gameState.moveHistory.length - index
        const notation = this.getMoveNotation(move)
        return `
          <div class="history-item">
            <span class="move-number">${moveNum}.</span>
            <span>${move.player === Player.Red ? 'Red' : 'Black'}: ${notation}</span>
          </div>
        `
      })
      .join('')
  }

  private getMoveNotation(move: MoveRecord): string {
    const fromSquare = this.getSquareName(move.from.row, move.from.col)
    const toSquare = this.getSquareName(move.to.row, move.to.col)
    let notation = `${fromSquare}-${toSquare}`

    if (move.captured) {
      notation = `${fromSquare}x${toSquare}`
    }
    if (move.wasPromotion) {
      notation += ' (K)'
    }

    return notation
  }

  private getSquareName(row: number, col: number): string {
    const colLetter = String.fromCharCode(97 + col) // a-h
    const rowNumber = 8 - row // 1-8 from bottom
    return `${colLetter}${rowNumber}`
  }

  private checkGameOver(): void {
    if (this.gameState.status !== GameStatus.Active) {
      this.showGameOverModal()
    }
  }

  private showGameOverModal(): void {
    let existingModal = document.querySelector('.game-over-modal')
    if (existingModal) {
      existingModal.remove()
    }

    const modal = document.createElement('div')
    modal.className = 'game-over-modal active'

    let winner = ''
    let message = ''

    switch (this.gameState.status) {
      case GameStatus.RedWins:
        winner = 'RED WINS'
        message =
          this.gameState.humanPlayer === Player.Red
            ? 'Congratulations! You have prevented the crime.'
            : 'The pre-crime was not prevented.'
        break
      case GameStatus.BlackWins:
        winner = 'BLACK WINS'
        message =
          this.gameState.humanPlayer === Player.Black
            ? 'Congratulations! You have prevented the crime.'
            : 'The pre-crime was not prevented.'
        break
      case GameStatus.Draw:
        winner = 'DRAW'
        message = 'The future remains uncertain.'
        break
    }

    modal.innerHTML = `
      <h2 class="game-over-title">${winner}</h2>
      <p class="game-over-message">${message}</p>
      <button class="holo-button" id="play-again-btn">NEW GAME</button>
    `

    document.body.appendChild(modal)

    document.getElementById('play-again-btn')!.addEventListener('click', () => {
      modal.remove()
      this.gameState.newGame()
    })
  }
}
