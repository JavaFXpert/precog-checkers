import { Board, Player, PieceType } from '../game/Board'

export class Evaluator {
  static readonly WIN_SCORE = 10000
  private static readonly PIECE_VALUE = 100
  private static readonly KING_VALUE = 180
  private static readonly CENTER_BONUS = 5
  private static readonly ADVANCE_BONUS = 2

  static evaluate(board: Board, player: Player): number {
    const opponent = player === Player.Red ? Player.Black : Player.Red
    const playerPieces = board.getPieces(player)
    const opponentPieces = board.getPieces(opponent)

    // Check for win/loss
    if (opponentPieces.length === 0) {
      return this.WIN_SCORE
    }
    if (playerPieces.length === 0) {
      return -this.WIN_SCORE
    }

    let score = 0

    // Evaluate player's pieces
    for (const { piece, row, col } of playerPieces) {
      score += this.evaluatePiece(piece, row, col, player)
    }

    // Evaluate opponent's pieces (negative)
    for (const { piece, row, col } of opponentPieces) {
      score -= this.evaluatePiece(piece, row, col, opponent)
    }

    return score
  }

  private static evaluatePiece(
    piece: { type: PieceType },
    row: number,
    col: number,
    player: Player
  ): number {
    let value = piece.type === PieceType.King ? this.KING_VALUE : this.PIECE_VALUE

    // Positional bonus: center control
    const centerDistance = Math.abs(3.5 - col) + Math.abs(3.5 - row)
    value += (7 - centerDistance) * this.CENTER_BONUS

    // Advancement bonus (closer to promotion for regular pieces)
    if (piece.type === PieceType.Regular) {
      if (player === Player.Red) {
        value += row * this.ADVANCE_BONUS
      } else {
        value += (7 - row) * this.ADVANCE_BONUS
      }
    }

    return value
  }
}
