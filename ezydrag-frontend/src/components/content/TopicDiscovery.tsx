import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, ArrowRight, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DiscoveredTopic } from "@/data/contentMockData";
import { useContentData } from "@/hooks/useSeoApi";


const difficultyColors = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusColors: Record<string, string> = {
  new: "bg-primary/20 text-primary border-primary/30",
  drafting: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  drafted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  published: "bg-green-500/20 text-green-400 border-green-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

const intentIcons: Record<string, string> = {
  informational: "ℹ️",
  commercial: "💼",
  transactional: "💳",
  navigational: "🧭",
};

export function TopicDiscovery() {
  const { data } = useContentData();
  const discoveredTopics = data?.discoveredTopics || [];
  const [topics, setTopics] = useState<DiscoveredTopic[]>(discoveredTopics);

  useEffect(() => {
    setTopics(discoveredTopics);
  }, [discoveredTopics]);

  const handleAction = (id: string, action: "drafting" | "dismissed") => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, status: action } : t)));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Topic & Keyword Discovery
            </CardTitle>
            <CardDescription>Low-competition, high-volume topics relevant to your industry</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {topics.filter((t) => t.status === "new").length} new opportunities
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead className="text-center">Volume</TableHead>
              <TableHead className="text-center">Difficulty</TableHead>
              <TableHead className="text-center">Intent</TableHead>
              <TableHead className="text-center">Rank</TableHead>
              <TableHead>Suggested Title</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic) => (
              <TableRow key={topic.id}>
                <TableCell className="font-medium text-foreground">{topic.keyword}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span>{topic.searchVolume.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={difficultyColors[topic.difficulty]}>
                    {topic.difficultyScore}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span title={topic.intent}>{intentIcons[topic.intent]}</span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {topic.currentRank ? `#${topic.currentRank}` : "—"}
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <span className="text-xs text-muted-foreground line-clamp-1">{topic.suggestedTitle}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={statusColors[topic.status]}>{topic.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {topic.status === "new" && (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary" onClick={() => handleAction(topic.id, "drafting")}>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleAction(topic.id, "dismissed")}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
