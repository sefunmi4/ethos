import React from 'react';
const ForceGraph2D = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} {...props} />
));
export default ForceGraph2D;
export const ForceGraphMethods = {} as any;
