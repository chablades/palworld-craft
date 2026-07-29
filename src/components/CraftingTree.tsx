"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildCraftingTree, getCraftableNames } from "@/lib/recipes";
import type { TreeNode } from "@/lib/types";

function layoutTree(root: TreeNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const levelGaps = new Map<number, number>();

  function walk(node: TreeNode, depth: number, parentId?: string) {
    const col = levelGaps.get(depth) ?? 0;
    levelGaps.set(depth, col + 1);

    nodes.push({
      id: node.id,
      position: { x: col * 220, y: depth * 120 },
      data: {
        label: `${node.name} ×${node.quantity}`,
      },
      style: {
        border: node.isRaw ? "1px solid #10b981" : "1px solid #f59e0b",
        background: node.isRaw ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
        borderRadius: 10,
        padding: 10,
        fontSize: 12,
        width: 180,
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

    for (const child of node.children) {
      walk(child, depth + 1, node.id);
    }
  }

  walk(root, 0);
  return { nodes, edges };
}

export function CraftingTree() {
  const craftables = useMemo(() => getCraftableNames(), []);
  const [item, setItem] = useState(craftables[0] ?? "Thermal Core");
  const [amount, setAmount] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

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
          <CardTitle>Visual Crafting Tree</CardTitle>
          <CardDescription>
            Explore the full ingredient dependency graph. Green nodes are raw materials; amber
            nodes are crafted intermediates.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Item</Label>
            <Select value={item} onValueChange={setItem}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {craftables.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </CardContent>
      </Card>

      <div className="h-[560px] overflow-hidden rounded-xl border bg-card">
        <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
          <Background gap={18} size={1} />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
