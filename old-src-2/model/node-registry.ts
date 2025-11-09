// import type { Node } from "./node.n";

// export type NodeConstructor<T extends Node = Node> = new (props: any) => T;

// class NodeRegistryClass {
//   private registry = new Map<string, NodeConstructor>();

//   register(name: string, ctor: NodeConstructor) {
//     if (this.registry.has(name)) {
//       console.warn(`Node type "${name}" is already registered.`);
//       return;
//     }
//     this.registry.set(name, ctor);
//   }

//   create(data: { type: string; props?: any; children?: any[] }): Node {
//     const ctor = this.registry.get(data.type);
//     if (!ctor) throw new Error(`Unknown node type: ${data.type}`);
//     const node = new ctor(data.props);
//     for (const child of data.children ?? []) {
//       node.addChild(this.create(child));
//     }
//     return node;
//   }

//   get(name: string) {
//     return this.registry.get(name);
//   }

//   listTypes() {
//     return [...this.registry.keys()];
//   }
// }

// export const NodeRegistry = new NodeRegistryClass();
