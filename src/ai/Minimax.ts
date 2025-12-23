import { Board, Player } from '../game/Board'
import { Move, MoveValidator, PieceMove } from '../game/Move'
import { Evaluator } from './Evaluator'

export interface SearchResult {
  fromRow: number
  fromCol: number
  move: Move
  score: number
}

export class Minimax {
  static findBestMove(board: Board, player: Player, depth: number): SearchResult | null {
    const moves = MoveValidator.getAllValidMoves(board, player)
    if (moves.length === 0) return null

    let bestResult: SearchResult | null = null
    let alpha = -Infinity
    const beta = Infinity

    for (const pieceMove of moves) {
      const newBoard = board.clone()
      Move.execute(newBoard, pieceMove.fromRow, pieceMove.fromCol, pieceMove.move)

      const score = this.minimax(
        newBoard,
        depth - 1,
        alpha,
        beta,
        false,
        player
      )

      if (bestResult === null || score > bestResult.score) {
        bestResult = {
          fromRow: pieceMove.fromRow,
          fromCol: pieceMove.fromCol,
          move: pieceMove.move,
          score,
        }
      }

      alpha = Math.max(alpha, score)
    }

    return bestResult
  }

  private static minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    player: Player
  ): number {
    const opponent = player === Player.Red ? Player.Black : Player.Red
    const currentPlayer = isMaximizing ? player : opponent

    // Terminal conditions
    if (depth === 0) {
      return Evaluator.evaluate(board, player)
    }

    const moves = MoveValidator.getAllValidMoves(board, currentPlayer)
    if (moves.length === 0) {
      // No moves = loss for current player
      return isMaximizing ? -Evaluator.WIN_SCORE : Evaluator.WIN_SCORE
    }

    if (isMaximizing) {
      let maxEval = -Infinity
      for (const pieceMove of moves) {
        const newBoard = board.clone()
        Move.execute(newBoard, pieceMove.fromRow, pieceMove.fromCol, pieceMove.move)
        const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, false, player)
        maxEval = Math.max(maxEval, evalScore)
        alpha = Math.max(alpha, evalScore)
        if (beta <= alpha) break // Beta cutoff
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const pieceMove of moves) {
        const newBoard = board.clone()
        Move.execute(newBoard, pieceMove.fromRow, pieceMove.fromCol, pieceMove.move)
        const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, true, player)
        minEval = Math.min(minEval, evalScore)
        beta = Math.min(beta, evalScore)
        if (beta <= alpha) break // Alpha cutoff
      }
      return minEval
    }
  }
}
