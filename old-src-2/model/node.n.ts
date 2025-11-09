export class Node {
  public parent: Node | undefined = undefined;

  private readonly children_inner: Node[] = [];

  constructor(public name: string) {}

  // MARK: Children

  public get children(): ReadonlyArray<Node> {
    return this.children_inner;
  }

  public add_child(child: Node) {
    // Cannot add a node as a child if it already has a parent
    if (child.parent !== undefined) {
      throw new Error(
        `Tried to add node ${child.name} as a child to node ${this.name} but already had parent node ${child.parent.name}`
      );
    }

    // Cannot have two child nodes with the same name, so all nodes' paths are unique
    if (this.children.some((c) => c.name === child.name)) {
      throw new Error(`Tried to add node ${child.name} as a child to ${this.name} but a child already had that name`);
    }

    child.parent = this;
    this.children_inner.push(child);
    child._ready_inner();
  }

  public remove_child(child: Node) {
    if (child.parent !== this) {
      return;
    }

    const index = this.children.findIndex((c) => c === child);
    if (index !== -1) {
      this.children_inner.splice(index, 0);
    }
    child.parent = undefined;
  }

  // MARK: Path

  /**
   * Gets this node's unique path
   */
  public get path(): string {
    let path = this.name;
    let parent = this.parent;
    while (parent !== undefined) {
      path = `${parent.name}/${path}`;
      parent = parent.parent;
    }
    return path;
  }

  // MARK: _ready()

  private _ready_inner(): void {
    this._ready();

    for (const child of this.children) {
      child._ready_inner();
    }
  }
  /** This method is meant to be overridden by inheriting classes
   */
  public _ready(): void {}

  // MARK: _process()

  public _process_inner(delta: number): void {
    this._process(delta);

    for (const child of this.children) {
      child._process_inner(delta);
    }
  }
  /** This method is meant to be overridden by inheriting classes
   */
  public _process(delta: number): void {}

  // MARK: _physics_process()

  public _physics_process_inner(delta: number): void {
    this._physics_process(delta);

    for (const child of this.children) {
      child._physics_process_inner(delta);
    }
  }
  /** This method is meant to be overridden by inheriting classes
   */
  public _physics_process(delta: number): void {}

  // MARK: _enter_tree()

  public _enter_tree_inner(): void {
    this._enter_tree();

    for (const child of this.children) {
      child._enter_tree_inner();
    }
  }
  /** This method is meant to be overridden by inheriting classes
   */
  public _enter_tree(): void {}

  // MARK: _exit_tree()

  public _exit_tree_inner(): void {
    this._exit_tree();

    for (const child of this.children) {
      child._exit_tree_inner();
    }
  }
  /** This method is meant to be overridden by inheriting classes
   */
  public _exit_tree(): void {}
}
