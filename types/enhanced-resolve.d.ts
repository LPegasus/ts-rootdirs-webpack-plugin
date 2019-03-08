declare module 'enhanced-resolve/lib/getInnerRequest' {
  function getInnerRequest(...args: any[]): any;
  export = getInnerRequest;
}

declare module 'enhanced-resolve/lib/createInnerContext' {
  function createInnerContext<T = any>(context: T): T;
  export = createInnerContext;
}
