import { describe, it, expect } from 'vitest'
import { Board, Piece, PieceType, Player } from '../../src/game/Board'

describe('Board', () => {
  describe('initialization', () => {
    it('should create an 8x8 board', () => {
      const board = new Board()
      expect(board.size).toBe(8)
    })

    it('should place 12 red pieces on the first three rows', () => {
      const board = new Board()
      const redPieces = board.getPieces(Player.Red)
      expect(redPieces.length).toBe(12)
    })

    it('should place 12 black pieces on the last three rows', () => {
      const board = new Board()
      const blackPieces = board.getPieces(Player.Black)
      expect(blackPieces.length).toBe(12)
    })

    it('should only place pieces on dark squares', () => {
      const board = new Board()
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board.getPieceAt(row, col)
          if (piece) {
            // Dark squares are where (row + col) is odd
            expect((row + col) % 2).toBe(1)
          }
        }
      }
    })

    it('should have empty middle rows', () => {
      const board = new Board()
      for (let col = 0; col < 8; col++) {
        expect(board.getPieceAt(3, col)).toBeNull()
        expect(board.getPieceAt(4, col)).toBeNull()
      }
    })
  })

  describe('piece access', () => {
    it('should get piece at valid position', () => {
      const board = new Board()
      const piece = board.getPieceAt(0, 1)
      expect(piece).not.toBeNull()
      expect(piece?.player).toBe(Player.Red)
    })

    it('should return null for empty square', () => {
      const board = new Board()
      const piece = board.getPieceAt(3, 0)
      expect(piece).toBeNull()
    })

    it('should return null for out of bounds', () => {
      const board = new Board()
      expect(board.getPieceAt(-1, 0)).toBeNull()
      expect(board.getPieceAt(8, 0)).toBeNull()
      expect(board.getPieceAt(0, -1)).toBeNull()
      expect(board.getPieceAt(0, 8)).toBeNull()
    })
  })

  describe('piece manipulation', () => {
    it('should move a piece to a new position', () => {
      const board = new Board()
      const piece = board.getPieceAt(2, 1)!
      board.movePiece(2, 1, 3, 2)

      expect(board.getPieceAt(2, 1)).toBeNull()
      expect(board.getPieceAt(3, 2)).toBe(piece)
    })

    it('should remove a piece', () => {
      const board = new Board()
      board.removePiece(0, 1)
      expect(board.getPieceAt(0, 1)).toBeNull()
    })
  })

  describe('king promotion', () => {
    it('should promote red piece to king when reaching row 7', () => {
      const board = Board.empty()
      board.setPiece(6, 1, { player: Player.Red, type: PieceType.Regular })
      board.movePiece(6, 1, 7, 2)

      const piece = board.getPieceAt(7, 2)
      expect(piece?.type).toBe(PieceType.King)
    })

    it('should promote black piece to king when reaching row 0', () => {
      const board = Board.empty()
      board.setPiece(1, 0, { player: Player.Black, type: PieceType.Regular })
      board.movePiece(1, 0, 0, 1)

      const piece = board.getPieceAt(0, 1)
      expect(piece?.type).toBe(PieceType.King)
    })

    it('should not promote king that is already a king', () => {
      const board = Board.empty()
      board.setPiece(6, 1, { player: Player.Red, type: PieceType.King })
      board.movePiece(6, 1, 7, 2)

      const piece = board.getPieceAt(7, 2)
      expect(piece?.type).toBe(PieceType.King)
    })
  })

  describe('clone', () => {
    it('should create an independent copy', () => {
      const board = new Board()
      const clone = board.clone()

      clone.removePiece(0, 1)

      expect(board.getPieceAt(0, 1)).not.toBeNull()
      expect(clone.getPieceAt(0, 1)).toBeNull()
    })
  })
})
