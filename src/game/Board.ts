export enum Player {
  Red = 'red',
  Black = 'black',
}

export enum PieceType {
  Regular = 'regular',
  King = 'king',
}

export interface Piece {
  player: Player
  type: PieceType
}

export class Board {
  readonly size = 8
  private grid: (Piece | null)[][]

  constructor() {
    this.grid = this.createInitialBoard()
  }

  private constructor_empty() {
    this.grid = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))
  }

  static empty(): Board {
    const board = Object.create(Board.prototype)
    board.grid = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))
    return board
  }

  private createInitialBoard(): (Piece | null)[][] {
    const grid: (Piece | null)[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))

    // Place red pieces (rows 0-2)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          grid[row][col] = { player: Player.Red, type: PieceType.Regular }
        }
      }
    }

    // Place black pieces (rows 5-7)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          grid[row][col] = { player: Player.Black, type: PieceType.Regular }
        }
      }
    }

    return grid
  }

  getPieceAt(row: number, col: number): Piece | null {
    if (row < 0 || row >= 8 || col < 0 || col >= 8) {
      return null
    }
    return this.grid[row][col]
  }

  setPiece(row: number, col: number, piece: Piece | null): void {
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      this.grid[row][col] = piece
    }
  }

  getPieces(player: Player): { piece: Piece; row: number; col: number }[] {
    const pieces: { piece: Piece; row: number; col: number }[] = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.grid[row][col]
        if (piece && piece.player === player) {
          pieces.push({ piece, row, col })
        }
      }
    }
    return pieces
  }

  movePiece(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    const piece = this.grid[fromRow][fromCol]
    if (!piece) return

    this.grid[fromRow][fromCol] = null
    this.grid[toRow][toCol] = piece

    // Check for promotion
    if (piece.type === PieceType.Regular) {
      if (piece.player === Player.Red && toRow === 7) {
        piece.type = PieceType.King
      } else if (piece.player === Player.Black && toRow === 0) {
        piece.type = PieceType.King
      }
    }
  }

  removePiece(row: number, col: number): void {
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      this.grid[row][col] = null
    }
  }

  clone(): Board {
    const newBoard = Board.empty()
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.grid[row][col]
        if (piece) {
          newBoard.grid[row][col] = { ...piece }
        }
      }
    }
    return newBoard
  }
}
