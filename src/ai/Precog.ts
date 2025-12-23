import { Board, Player } from '../game/Board'
import { Move, MoveValidator, PieceMove } from '../game/Move'
import { Evaluator } from './Evaluator'
import { Minimax } from './Minimax'

export interface FutureVision {
  moves: PieceMove[]
  finalBoard: Board
  evaluation: number
  description: string
}

export class Precog {
  /**
   * Generate precognitive visions of possible futures.
   * Shows what could happen if the player makes certain moves.
   */
  static getFutures(
    board: Board,
    player: Player,
    numVisions: number = 3,
    depth: number = 4
  ): FutureVision[] {
    const moves = MoveValidator.getAllValidMoves(board, player)
    if (moves.length === 0) return []

    const visions: FutureVision[] = []

    // Evaluate each possible move and simulate the game forward
    for (const pieceMove of moves) {
      const vision = this.simulateFuture(board, player, pieceMove, depth)
      visions.push(vision)
    }

    // Sort by evaluation (best futures first) and take top N
    visions.sort((a, b) => b.evaluation - a.evaluation)
    return visions.slice(0, numVisions)
  }

  /**
   * Get the AI's predicted counter-move for a given player move.
   * This shows what the AI "sees" happening if you make a move.
   */
  static getPredictedResponse(
    board: Board,
    playerMove: PieceMove,
    aiPlayer: Player,
    depth: number = 4
  ): FutureVision | null {
    const newBoard = board.clone()
    Move.execute(newBoard, playerMove.fromRow, playerMove.fromCol, playerMove.move)

    const aiResponse = Minimax.findBestMove(newBoard, aiPlayer, depth)
    if (!aiResponse) return null

    const afterAiMove = newBoard.clone()
    Move.execute(afterAiMove, aiResponse.fromRow, aiResponse.fromCol, aiResponse.move)

    return {
      moves: [
        playerMove,
        { fromRow: aiResponse.fromRow, fromCol: aiResponse.fromCol, move: aiResponse.move },
      ],
      finalBoard: afterAiMove,
      evaluation: aiResponse.score,
      description: this.describeVision(aiResponse.score, aiPlayer),
    }
  }

  private static simulateFuture(
    board: Board,
    player: Player,
    initialMove: PieceMove,
    depth: number
  ): FutureVision {
    const opponent = player === Player.Red ? Player.Black : Player.Red
    const moves: PieceMove[] = [initialMove]
    let currentBoard = board.clone()

    // Execute player's move
    Move.execute(currentBoard, initialMove.fromRow, initialMove.fromCol, initialMove.move)

    // Simulate a few moves ahead
    let currentPlayer = opponent
    for (let i = 0; i < depth && moves.length < 6; i++) {
      const bestMove = Minimax.findBestMove(currentBoard, currentPlayer, 2)
      if (!bestMove) break

      moves.push({
        fromRow: bestMove.fromRow,
        fromCol: bestMove.fromCol,
        move: bestMove.move,
      })

      Move.execute(currentBoard, bestMove.fromRow, bestMove.fromCol, bestMove.move)
      currentPlayer = currentPlayer === Player.Red ? Player.Black : Player.Red
    }

    const evaluation = Evaluator.evaluate(currentBoard, player)

    return {
      moves,
      finalBoard: currentBoard,
      evaluation,
      description: this.describeVision(evaluation, player),
    }
  }

  private static describeVision(score: number, player: Player): string {
    if (score >= Evaluator.WIN_SCORE) {
      return 'Victory is certain'
    } else if (score <= -Evaluator.WIN_SCORE) {
      return 'Defeat looms'
    } else if (score > 200) {
      return 'A promising future'
    } else if (score > 50) {
      return 'Slight advantage ahead'
    } else if (score < -200) {
      return 'Danger approaches'
    } else if (score < -50) {
      return 'Caution advised'
    } else {
      return 'The future is unclear'
    }
  }
}
