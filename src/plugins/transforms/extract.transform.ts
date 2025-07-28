import { TransformPlugin } from "../transform.plugin";


import { marked } from 'marked';  // for markdown parsing
// import { JSDOM } from 'jsdom';    // for HTML parsing if needed

interface HeadingNode {
  depth: number;
  text: string;
  children: HeadingNode[];
}


export class ExtractTransform implements TransformPlugin {
  canHandle(type: any): boolean {
    return type === 'extract';
  }


  /**
   *
   * @param data string
   * @param config
   *              target: headings
   *              format: 'markdown' | 'html',
   *              depth?: number,
   *              structure?: 'tree' | 'flat'
   *
   * @returns
   */

  transform(content: any, config?: any) {
    const data = config.format === 'markdown'
      ? marked.lexer(content)
      : [];


    switch (config.target) {
      case 'headings':
        return this.extractHeading(data, config.depth || 2)

      case 'all':
        return data;
    }
    return data;
  }

  private extractHeading(content: any[], maxDepth: number) {
    const tree: HeadingNode[] = [];
    const stack: HeadingNode[] = [];

    for (const token of content) {
      if (token.type === 'heading' && token.depth <= maxDepth) {
        const node: HeadingNode = {
          text: token.text,
          depth: token.depth,
          children: [],
        };

        // Find where to insert the node in the stack/tree
        while (stack.length && stack[stack.length - 1].depth >= node.depth) {
          stack.pop();
        }

        if (stack.length === 0) {
          tree.push(node); // top-level
        } else {
          stack[stack.length - 1].children.push(node); // child of previous node
        }

        stack.push(node);
      }
    }

    return tree;
  }

}



