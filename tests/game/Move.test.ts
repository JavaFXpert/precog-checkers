import { describe, it, expect } from 'vitest'
import { Board, Player, PieceType } from '../../src/game/Board'
import { Move, MoveValidator, MoveType } from '../../src/game/Move'

describe('MoveValidator', () => {
  describe('regular piece movement', () => {
    it('should allow red piece to move diagonally forward (down)', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 2, 1)
      expect(moves).toContainEqual({ toRow: 3, toCol: 0, type: MoveType.Regular })
      expect(moves).toContainEqual({ toRow: 3, toCol: 2, type: MoveType.Regular })
    })

    it('should allow black piece to move diagonally forward (up)', () => {
      const board = Board.empty()
      board.setPiece(5, 2, { player: Player.Black, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 5, 2)
      expect(moves).toContainEqual({ toRow: 4, toCol: 1, type: MoveType.Regular })
      expect(moves).toContainEqual({ toRow: 4, toCol: 3, type: MoveType.Regular })
    })

    it('should not allow regular piece to move backward', () => {
      const board = Board.empty()
      board.setPiece(3, 2, { player: Player.Red, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 3, 2)
      const backwardMoves = moves.filter(m => m.toRow < 3)
      expect(backwardMoves.length).toBe(0)
    })

    it('should not allow moves to occupied squares', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 2, { player: Player.Red, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 2, 1)
      expect(moves).not.toContainEqual(expect.objectContaining({ toRow: 3, toCol: 2 }))
    })

    it('should not allow moves outside the board', () => {
      const board = Board.empty()
      board.setPiece(0, 1, { player: Player.Red, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 0, 1)
      // Should only have forward moves, no backward out-of-bounds
      moves.forEach(m => {
        expect(m.toRow).toBeGreaterThanOrEqual(0)
        expect(m.toRow).toBeLessThan(8)
        expect(m.toCol).toBeGreaterThanOrEqual(0)
        expect(m.toCol).toBeLessThan(8)
      })
    })
  })

  describe('king movement', () => {
    it('should allow king to move in all diagonal directions', () => {
      const board = Board.empty()
      board.setPiece(3, 3, { player: Player.Red, type: PieceType.King })

      const moves = MoveValidator.getValidMoves(board, 3, 3)
      expect(moves).toContainEqual({ toRow: 2, toCol: 2, type: MoveType.Regular })
      expect(moves).toContainEqual({ toRow: 2, toCol: 4, type: MoveType.Regular })
      expect(moves).toContainEqual({ toRow: 4, toCol: 2, type: MoveType.Regular })
      expect(moves).toContainEqual({ toRow: 4, toCol: 4, type: MoveType.Regular })
    })
  })

  describe('capture moves', () => {
    it('should allow capturing enemy piece by jumping', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 2, 1)
      expect(moves).toContainEqual({
        toRow: 4,
        toCol: 3,
        type: MoveType.Capture,
        capturedRow: 3,
        capturedCol: 2,
      })
    })

    it('should not allow capturing own piece', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 2, { player: Player.Red, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 2, 1)
      const captures = moves.filter(m => m.type === MoveType.Capture)
      expect(captures.length).toBe(0)
    })

    it('should not allow jump if landing square is occupied', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })
      board.setPiece(4, 3, { player: Player.Red, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 2, 1)
      const captureToBlocked = moves.filter(
        m => m.type === MoveType.Capture && m.toRow === 4 && m.toCol === 3
      )
      expect(captureToBlocked.length).toBe(0)
    })

    it('should NOT allow regular piece to capture backward', () => {
      const board = Board.empty()
      board.setPiece(4, 3, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 4, 3)
      // Regular pieces can only capture forward, not backward
      const backwardCaptures = moves.filter(
        m => m.type === MoveType.Capture && m.toRow < 4
      )
      expect(backwardCaptures.length).toBe(0)
    })

    it('should allow king to capture backward', () => {
      const board = Board.empty()
      board.setPiece(4, 3, { player: Player.Red, type: PieceType.King })
      board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 4, 3)
      expect(moves).toContainEqual({
        toRow: 2,
        toCol: 1,
        type: MoveType.Capture,
        capturedRow: 3,
        capturedCol: 2,
      })
    })
  })

  describe('forced capture rule', () => {
    it('should return only captures when captures are available', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })

      const moves = MoveValidator.getValidMoves(board, 2, 1)
      // When capture is available, only capture moves should be returned
      expect(moves.every(m => m.type === MoveType.Capture)).toBe(true)
    })

    it('should enforce captures across all pieces for a player', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(2, 5, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 4, { player: Player.Black, type: PieceType.Regular })

      // The piece at (2,1) has no capture, but (2,5) does
      const allMoves = MoveValidator.getAllValidMoves(board, Player.Red)

      // Should only return capture moves
      expect(allMoves.every(m => m.move.type === MoveType.Capture)).toBe(true)
    })
  })

  describe('multi-jump', () => {
    it('should detect multi-jump opportunities', () => {
      const board = Board.empty()
      board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
      board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })
      board.setPiece(5, 4, { player: Player.Black, type: PieceType.Regular })

      const chains = MoveValidator.getCaptureChains(board, 2, 1)
      // Should find a chain: (2,1) -> (4,3) -> (6,5)
      const doubleJump = chains.find(c => c.length === 2)
      expect(doubleJump).toBeDefined()
    })
  })
})

describe('Move execution', () => {
  it('should execute a regular move', () => {
    const board = Board.empty()
    board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })

    const move: Move = { toRow: 3, toCol: 2, type: MoveType.Regular }
    Move.execute(board, 2, 1, move)

    expect(board.getPieceAt(2, 1)).toBeNull()
    expect(board.getPieceAt(3, 2)).not.toBeNull()
  })

  it('should execute a capture move and remove captured piece', () => {
    const board = Board.empty()
    board.setPiece(2, 1, { player: Player.Red, type: PieceType.Regular })
    board.setPiece(3, 2, { player: Player.Black, type: PieceType.Regular })

    const move: Move = {
      toRow: 4,
      toCol: 3,
      type: MoveType.Capture,
      capturedRow: 3,
      capturedCol: 2,
    }
    Move.execute(board, 2, 1, move)

    expect(board.getPieceAt(2, 1)).toBeNull()
    expect(board.getPieceAt(3, 2)).toBeNull() // Captured piece removed
    expect(board.getPieceAt(4, 3)).not.toBeNull()
  })
})
