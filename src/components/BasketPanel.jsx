import React from "react";

export default function BasketPanel({ basket, onRemove }) {
  if (basket.length === 0) return null;

  return (
    <div className="basket-panel">
      <div className="basket-header">BASKET ({basket.length})</div>
      <div className="basket-items">
        {basket.map((item) => (
          <div key={item.id} className="basket-item">
            <div className="basket-item-header">
              <div className="basket-item-criteria">
                {item.genres.length > 0 && (
                  <span className="basket-tag">{item.genres.join(", ")}</span>
                )}
                {item.locations.length > 0 && (
                  <span className="basket-tag">{item.locations.join(", ")}</span>
                )}
                {item.bpms.length > 0 && (
                  <span className="basket-tag">{item.bpms.join(", ")}</span>
                )}
              </div>
              <button className="basket-remove-btn" onClick={() => onRemove(item.id)}>
                ×
              </button>
            </div>
            <div className="basket-item-count">{item.djs.length} DJs</div>
          </div>
        ))}
      </div>
    </div>
  );
}
