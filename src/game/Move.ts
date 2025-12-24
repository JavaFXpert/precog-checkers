import { Board, Player, PieceType } from './Board'

export enum MoveType {
  Regular = 'regular',
  Capture = 'capture',
}

export interface Move {
  toRow: number
  toCol: number
  type: MoveType
  capturedRow?: number
  capturedCol?: number
}

export interface PieceMove {
  fromRow: number
  fromCol: number
  move: Move
}

export class MoveValidator {
  private static readonly DIRECTIONS = [
    [-1, -1], [-1, 1], // backward
    [1, -1], [1, 1],   // forward
  ]

  static getValidMoves(board: Board, row: number, col: number): Move[] {
    const piece = board.getPieceAt(row, col)
    if (!piece) return []

    const captures = this.getCaptureMoves(board, row, col, piece.player, piece.type)
    if (captures.length > 0) {
      return captures
    }

    return this.getRegularMoves(board, row, col, piece.player, piece.type)
  }

  static getAllValidMoves(board: Board, player: Player): PieceMove[] {
    const pieces = board.getPieces(player)
    const allMoves: PieceMove[] = []
    let hasCapture = false

    // First pass: check if any captures exist
    for (const { row, col, piece } of pieces) {
      const captures = this.getCaptureMoves(board, row, col, piece.player, piece.type)
      if (captures.length > 0) {
        hasCapture = true
        for (const move of captures) {
          allMoves.push({ fromRow: row, fromCol: col, move })
        }
      }
    }

    // If captures exist, return only captures (forced capture rule)
    if (hasCapture) {
      return allMoves
    }

    // Otherwise, return all regular moves
    for (const { row, col, piece } of pieces) {
      const moves = this.getRegularMoves(board, row, col, piece.player, piece.type)
      for (const move of moves) {
        allMoves.push({ fromRow: row, fromCol: col, move })
      }
    }

    return allMoves
  }

  private static getRegularMoves(
    board: Board,
    row: number,
    col: number,
    player: Player,
    type: PieceType
  ): Move[] {
    const moves: Move[] = []
    const directions = this.getDirections(player, type)

    for (const [dr, dc] of directions) {
      const newRow = row + dr
      const newCol = col + dc

      if (this.isValidPosition(newRow, newCol) && !board.getPieceAt(newRow, newCol)) {
        moves.push({ toRow: newRow, toCol: newCol, type: MoveType.Regular })
      }
    }

    return moves
  }

  private static getCaptureMoves(
    board: Board,
    row: number,
    col: number,
    player: Player,
    type: PieceType
  ): Move[] {
    const moves: Move[] = []
    // Only kings can capture in any direction; regular pieces capture forward only
    const directions = this.getDirections(player, type)

    for (const [dr, dc] of directions) {
      const jumpedRow = row + dr
      const jumpedCol = col + dc
      const landRow = row + 2 * dr
      const landCol = col + 2 * dc

      if (!this.isValidPosition(landRow, landCol)) continue

      const jumpedPiece = board.getPieceAt(jumpedRow, jumpedCol)
      const landSquare = board.getPieceAt(landRow, landCol)

      if (jumpedPiece && jumpedPiece.player !== player && !landSquare) {
        moves.push({
          toRow: landRow,
          toCol: landCol,
          type: MoveType.Capture,
          capturedRow: jumpedRow,
          capturedCol: jumpedCol,
        })
      }
    }

    return moves
  }

  static getCaptureChains(board: Board, row: number, col: number): Move[][] {
    const piece = board.getPieceAt(row, col)
    if (!piece) return []

    const chains: Move[][] = []
    this.findCaptureChains(board.clone(), row, col, piece.player, piece.type, [], chains)
    return chains
  }

  private static findCaptureChains(
    board: Board,
    row: number,
    col: number,
    player: Player,
    type: PieceType,
    currentChain: Move[],
    allChains: Move[][]
  ): void {
    const captures = this.getCaptureMoves(board, row, col, player, type)

    if (captures.length === 0) {
      if (currentChain.length > 0) {
        allChains.push([...currentChain])
      }
      return
    }

    for (const capture of captures) {
      const newBoard = board.clone()
      Move.execute(newBoard, row, col, capture)

      // Check for promotion during chain
      const newPiece = newBoard.getPieceAt(capture.toRow, capture.toCol)
      const newType = newPiece?.type ?? type

      this.findCaptureChains(
        newBoard,
        capture.toRow,
        capture.toCol,
        player,
        newType,
        [...currentChain, capture],
        allChains
      )
    }
  }

  private static getDirections(player: Player, type: PieceType): number[][] {
    if (type === PieceType.King) {
      return this.DIRECTIONS
    }
    // Regular pieces: Red moves down (positive row), Black moves up (negative row)
    if (player === Player.Red) {
      return [[1, -1], [1, 1]]
    } else {
      return [[-1, -1], [-1, 1]]
    }
  }

  private static isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }
}

export namespace Move {
  export function execute(board: Board, fromRow: number, fromCol: number, move: Move): void {
    if (move.type === MoveType.Capture && move.capturedRow !== undefined && move.capturedCol !== undefined) {
      board.removePiece(move.capturedRow, move.capturedCol)
    }
    board.movePiece(fromRow, fromCol, move.toRow, move.toCol)
  }
}
