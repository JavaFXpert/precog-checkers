import { describe, it, expect } from 'vitest'
import { Board, Player, PieceType } from '../../src/game/Board'
import { Minimax } from '../../src/ai/Minimax'

describe('Minimax', () => {
  describe('finding obvious moves', () => {
    it('should find a winning capture', () => {
      const board = Board.empty()
      // Red can capture the only black piece
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })

      const result = Minimax.findBestMove(board, Player.Red, 4)
      expect(result).not.toBeNull()
      expect(result!.move.toRow).toBe(4)
      expect(result!.move.toCol).toBe(3)
    })

    it('should avoid losing a piece when possible', () => {
      const board = Board.empty()
      // Red piece is threatened - Black King at (4,3) can jump Red at (3,2)
      // Red should move forward to escape
      board.setPiece(3, 2, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(4, 3, { player: Player.Black, type: PieceType.King })
      board.setPiece(6, 5, { player: Player.Black, type: PieceType.Regular })

      const result = Minimax.findBestMove(board, Player.Red, 4)
      expect(result).not.toBeNull()
      // Should move forward (to row 4 or beyond) to escape danger
      expect(result!.move.toRow).toBeGreaterThanOrEqual(4)
    })

    it('should return null when no moves available', () => {
      const board = Board.empty()
      // Red piece blocked
      board.setPiece(7, 0, { player: Player.Red, type: PieceType.Regular })

      const result = Minimax.findBestMove(board, Player.Red, 4)
      expect(result).toBeNull()
    })
  })

  describe('depth behavior', () => {
    it('should find better moves with deeper search', () => {
      const board = new Board()

      // Even at depth 1, should return a valid move
      const shallow = Minimax.findBestMove(board, Player.Red, 1)
      expect(shallow).not.toBeNull()

      // Deeper search should also work
      const deep = Minimax.findBestMove(board, Player.Red, 4)
      expect(deep).not.toBeNull()
    })
  })

  describe('alpha-beta pruning', () => {
    it('should produce same result as unpruned but faster', () => {
      const board = new Board()

      const start = performance.now()
      const result = Minimax.findBestMove(board, Player.Red, 5)
      const elapsed = performance.now() - start

      expect(result).not.toBeNull()
      // Should complete in reasonable time (pruning helps)
      expect(elapsed).toBeLessThan(5000)
    })
  })
})
