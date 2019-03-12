
export class SnapGrid2 {
  constructor(editor, { size = 16 }) {
    this.editor = editor;
    this.size = size;

    this.editor.on('rendernode', ({ node, el }) => {
      el.addEventListener('mouseup', this.onDrag.bind(this, node));
      el.addEventListener('touchend', this.onDrag.bind(this, node));
      el.addEventListener('touchcancel', this.onDrag.bind(this, node));
    });
  }


  onDrag(node) {
    const [x, y] = node.position;

    node.position[0] = this.snap(x);
    node.position[1] = this.snap(y);
    console.log(this, x, y, node.position)

    this.editor.view.nodes.get(node).update();
    this.editor.view.updateConnections({ node });

    this.editor.updateAreaSize();
  }

  snap(value) {
    return Math.round(value / this.size) * this.size;
  }
}
