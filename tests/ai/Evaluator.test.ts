import { describe, it, expect } from 'vitest'
import { Board, Player, PieceType } from '../../src/game/Board'
import { Evaluator } from '../../src/ai/Evaluator'

describe('Evaluator', () => {
  describe('material scoring', () => {
    it('should return 0 for equal material', () => {
      const board = new Board() // Starting position
      const score = Evaluator.evaluate(board, Player.Red)
      expect(score).toBe(0)
    })

    it('should return positive score when player has more pieces', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(2, 3, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(5, 2, { player: Player.Black, type: PieceType.Regular })

      const score = Evaluator.evaluate(board, Player.Red)
      expect(score).toBeGreaterThan(0)
    })

    it('should return negative score when opponent has more pieces', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(5, 2, { player: Player.Black, type: PieceType.Regular })
      board.setPiece(5, 4, { player: Player.Black, type: PieceType.Regular })

      const score = Evaluator.evaluate(board, Player.Red)
      expect(score).toBeLessThan(0)
    })
  })

  describe('king value', () => {
    it('should value kings more than regular pieces', () => {
      const board1 = Board.empty()
      board1.setPiece(3, 2, { player: Player.Red, type: PieceType.Regular })
      board1.setPiece(6, 5, { player: Player.Black, type: PieceType.Regular })

      const board2 = Board.empty()
      board2.setPiece(3, 2, { player: Player.Red, type: PieceType.King })
      board2.setPiece(6, 5, { player: Player.Black, type: PieceType.Regular })

      const score1 = Evaluator.evaluate(board1, Player.Red)
      const score2 = Evaluator.evaluate(board2, Player.Red)

      expect(score2).toBeGreaterThan(score1)
    })
  })

  describe('positional scoring', () => {
    it('should favor pieces closer to promotion', () => {
      const board1 = Board.empty()
      board1.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board1.setPiece(4, 5, { player: Player.Black, type: PieceType.Regular })

      const board2 = Board.empty()
      board2.setPiece(6, 1, { player: Player.Red, type: PieceType.Regular })
      board2.setPiece(4, 5, { player: Player.Black, type: PieceType.Regular })

      const score1 = Evaluator.evaluate(board1, Player.Red)
      const score2 = Evaluator.evaluate(board2, Player.Red)

      expect(score2).toBeGreaterThan(score1)
    })

    it('should favor center control', () => {
      const boardEdge = Board.empty()
      boardEdge.setPiece(3, 0, { player: Player.Red, type: PieceType.Regular })
      boardEdge.setPiece(6, 5, { player: Player.Black, type: PieceType.Regular })

      const boardCenter = Board.empty()
      boardCenter.setPiece(3, 3, { player: Player.Red, type: PieceType.Regular })
      boardCenter.setPiece(6, 5, { player: Player.Black, type: PieceType.Regular })

      const scoreEdge = Evaluator.evaluate(boardEdge, Player.Red)
      const scoreCenter = Evaluator.evaluate(boardCenter, Player.Red)

      expect(scoreCenter).toBeGreaterThan(scoreEdge)
    })
  })

  describe('game ending', () => {
    it('should return very high score for winning position', () => {
      const board = Board.empty()
      board.setPiece(3, 2, { player: Player.Red, type: PieceType.Regular })
      // Black has no pieces - Red wins

      const score = Evaluator.evaluate(board, Player.Red)
      expect(score).toBe(Evaluator.WIN_SCORE)
    })

    it('should return very low score for losing position', () => {
      const board = Board.empty()
      board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })
      // Red has no pieces - Red loses

      const score = Evaluator.evaluate(board, Player.Red)
      expect(score).toBe(-Evaluator.WIN_SCORE)
    })
  })
})
