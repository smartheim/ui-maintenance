import { nodesBBox } from './utils';

export function zoomAt(editor, nodes = editor.nodes) {
  const bbox = nodesBBox(editor, nodes);
  const [x, y] = bbox.getCenter();
  const [w, h] = [editor.view.container.clientWidth, editor.view.container.clientHeight];
  const { area } = editor.view;

  var [kw, kh] = [w / bbox.width, h / bbox.height]
  var k = Math.min(kh * 0.9, kw * 0.9, 1);

  area.transform.x = area.container.clientWidth / 2 - x * k;
  area.transform.y = area.container.clientHeight / 2 - y * k;
  area.zoom(k, 0, 0);

  area.update();
}

const min = (arr) => arr.length === 0 ? 0 : Math.min(...arr);
const max = (arr) => arr.length === 0 ? 0 : Math.max(...arr);

export function nodesBBox(editor, nodes) {
  const left = min(nodes.map(node => node.position[0]));
  const top = min(nodes.map(node => node.position[1]));
  const right = max(nodes.map(node => node.position[0] + editor.view.nodes.get(node).el.clientWidth));
  const bottom = max(nodes.map(node => node.position[1] + editor.view.nodes.get(node).el.clientHeight));

  return {
    left,
    right,
    top,
    bottom,
    width: Math.abs(left - right),
    height: Math.abs(top - bottom),
    getCenter: () => {
      return [
        (left + right) / 2,
        (top + bottom) / 2
      ];
    }
  };
}
