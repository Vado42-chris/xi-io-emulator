import React from 'react';
import type { GameRecord } from '../data/gameModels';
import type { GameRecommendation } from '../services/recommendationService';
import { platformLabel } from '../services/arcadeCatalogService';

interface GameRecommendationsProps {
  title: string;
  recommendations: GameRecommendation[];
  onSelectGame: (game: GameRecord) => void;
  compact?: boolean;
}

export const GameRecommendations: React.FC<GameRecommendationsProps> = ({
  title,
  recommendations,
  onSelectGame,
  compact = false,
}) => {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className={`game-recommendations ${compact ? 'game-recommendations--compact' : ''}`}>
      <h3 className="game-recommendations-title">{title}</h3>
      <div className="game-recommendations-row">
        {recommendations.map((rec) => (
          <button
            key={rec.game.id}
            type="button"
            className="game-recommendation-card"
            onClick={() => onSelectGame(rec.game)}
            aria-label={`Open ${rec.game.title}`}
          >
            <div className="game-recommendation-art">
              {rec.game.mappings?.artwork?.boxart ? (
                <img src={rec.game.mappings.artwork.boxart} alt="" loading="lazy" />
              ) : (
                <span className="game-recommendation-fallback">
                  {rec.game.title.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="game-recommendation-body">
              <span className="game-recommendation-name">{rec.game.title}</span>
              <span className="game-recommendation-system">{platformLabel(rec.game.systemId)}</span>
              {!compact && rec.reasons.length > 0 && (
                <span className="game-recommendation-reason">{rec.reasons[0]}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
