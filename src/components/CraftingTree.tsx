"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ItemTypeahead } from "@/components/ItemTypeahead";
import { buildCraftingTree, getCraftableNames } from "@/lib/recipes";
import type { TreeNode } from "@/lib/types";

const NODE_WIDTH = 200;
const H_GAP = 36;
const V_GAP = 130;

/** Center-aligned hierarchy: looked-up item is the parent at the top; ingredients fan out below. */
function layoutTree(root: TreeNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const subtreeWidth = new Map<string, number>();

  function measure(node: TreeNode): number {
    if (node.children.length === 0) {
      subtreeWidth.set(node.id, NODE_WIDTH);
      return NODE_WIDTH;
    }
    const width = node.children.reduce((sum, child, index) => {
      return sum + measure(child) + (index > 0 ? H_GAP : 0);
    }, 0);
    const finalWidth = Math.max(NODE_WIDTH, width);
    subtreeWidth.set(node.id, finalWidth);
    return finalWidth;
  }

  function place(node: TreeNode, depth: number, left: number, parentId?: string) {
    const width = subtreeWidth.get(node.id) ?? NODE_WIDTH;
    const x = left + width / 2 - NODE_WIDTH / 2;
    const y = depth * V_GAP;
    const isRoot = !parentId;

    nodes.push({
      id: node.id,
      position: { x, y },
      data: {
        label: `${node.name} ×${node.quantity}`,
      },
      style: {
        border: isRoot
          ? "2px solid var(--primary)"
          : node.isRaw
            ? "1px solid #10b981"
            : "1px solid #f59e0b",
        background: isRoot
          ? "color-mix(in oklab, var(--primary) 18%, transparent)"
          : node.isRaw
            ? "rgba(16,185,129,0.12)"
            : "rgba(245,158,11,0.12)",
        borderRadius: 10,
        padding: 10,
        fontSize: 12,
        width: NODE_WIDTH,
        fontWeight: isRoot ? 650 : 500,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    if (parentId) {
      edges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        animated: !node.isRaw,
      });
    }

    let childLeft = left;
    const childrenWidth = node.children.reduce((sum, child, index) => {
      return sum + (subtreeWidth.get(child.id) ?? NODE_WIDTH) + (index > 0 ? H_GAP : 0);
    }, 0);
    if (childrenWidth < width) {
      childLeft += (width - childrenWidth) / 2;
    }

    for (const child of node.children) {
      const childWidth = subtreeWidth.get(child.id) ?? NODE_WIDTH;
      place(child, depth + 1, childLeft, node.id);
      childLeft += childWidth + H_GAP;
    }
  }

  measure(root);
  place(root, 0, 0);
  return { nodes, edges };
}

export function CraftingTree() {
  const searchParams = useSearchParams();
  const craftables = useMemo(() => getCraftableNames(), []);
  const urlItem = searchParams.get("item") ?? "";
  const urlQty = Number(searchParams.get("qty") ?? "1");
  const [item, setItem] = useState(
    craftables.includes(urlItem) ? urlItem : (craftables[0] ?? "AI Core"),
  );
  const [amount, setAmount] = useState(
    Number.isFinite(urlQty) && urlQty > 0 ? Math.floor(urlQty) : 1,
  );
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (craftables.includes(urlItem)) setItem(urlItem);
    if (Number.isFinite(urlQty) && urlQty > 0) setAmount(Math.floor(urlQty));
  }, [urlItem, urlQty, craftables]);

  const rebuild = useCallback(() => {
    try {
      const tree = buildCraftingTree(item, Math.max(1, amount));
      const layout = layoutTree(tree);
      setNodes(layout.nodes);
      setEdges(layout.edges);
    } catch {
      setNodes([]);
      setEdges([]);
    }
  }, [item, amount]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Crafting Tree</CardTitle>
          <CardDescription>
            The item you look up is the parent at the top. Direct ingredients and deeper crafts
            appear as children below (amber = craftable, green = raw).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_120px_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="tree-item">Parent item</Label>
            <ItemTypeahead
              id="tree-item"
              value={item}
              options={craftables}
              onValueChange={setItem}
              placeholder="Type a craftable item…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tree-amount">Quantity</Label>
            <Input
              id="tree-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 1)}
            />
          </div>
          <Button type="button" variant="secondary" asChild>
            <Link href={`/?item=${encodeURIComponent(item)}&qty=${Math.max(1, amount)}`}>
              Open in calculator
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="h-[600px] overflow-hidden rounded-xl border bg-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} />
          <MiniMap pannable zoomable />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
