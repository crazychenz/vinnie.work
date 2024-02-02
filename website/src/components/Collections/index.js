import React from 'react';

/*var responsiveColumnsContainer = {
  flex: 1,
  display: flex,
  flexWrap: wrap,
};

var responsiveColumnGroup = {
  flex: 1,
  minWidth: '200px',// Adjust the minimum width of each item as needed
  margin: '8px',
  padding: '16px',
  backgroundColor: '#f0f0f0',
  boxSizing: 'border-box',
};*/

export function CollectionGroup({ children }) {
  return <div className="responsiveColumnGroup">{children}</div>;
}

export function CollectionContainer({ children }) {
  return <div className="responsiveColumnsContainer">{children}</div>;
}

/*export default function Collections() {
  return (
    <>
      <div className="responsiveColumnsContainer">
        <div className="responsiveColumnGroup">1</div>
        <div className="responsiveColumnGroup">2</div>
        <div className="responsiveColumnGroup">3</div>
      </div>
    </>
  );
}*/
