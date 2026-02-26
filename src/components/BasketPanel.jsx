import React from "react";

export default function BasketPanel({ basket, onRemove }) {
  if (basket.length === 0) return null;

  return (
    <div className="basket-panel">
      <div className="basket-items">
        {basket.map((item) => (
          <div key={item.id} className="basket-item">
            <div className="basket-item-header">
              <div className="basket-item-criteria">
                <span className="basket-tag">
                  {item.djs.length} {item.locations.join(", ")} drop
                  {item.djs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                className="basket-remove-btn"
                onClick={() => onRemove(item.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
