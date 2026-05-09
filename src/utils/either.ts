import {type Either, isLeft} from "fp-ts/Either"

/**
 * Handle an Either result with callbacks for success and error
 */
export const handleEither = <E, A>(
  result: Either<E, A>,
  onSuccess: (value: A) => void,
  onError: (error: E) => void
): void => {
  if (isLeft(result)) onError(result.left)
  else onSuccess(result.right)
}
