import { Star } from 'lucide-react'
import type { FavoriteObjectType } from '#/stores/dashboardStore'
import { useFavorites } from '#/hooks/useFavorites'

export type FavoriteStarProps = {
  objectType: FavoriteObjectType
  objectId: string
}

export function FavoriteStar({ objectType, objectId }: FavoriteStarProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(objectType, objectId)

  return (
    <button
      type="button"
      className={`rd-fav-star${active ? ' is-active' : ''}`}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={active}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void toggleFavorite(objectType, objectId)
      }}
    >
      <Star className="size-4" fill={active ? 'currentColor' : 'none'} />
    </button>
  )
}
