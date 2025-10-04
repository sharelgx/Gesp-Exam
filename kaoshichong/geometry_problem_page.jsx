import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Latex from "react-latex-next";

const GeometryProblemPage = () => {
  const [answer, setAnswer] = useState("");

  const problemLatex = `
**题目描述**\\
如图，正四棱锥 $P$-$ABCD$ 的底面 $ABCD$ 为边长为 $a$ 的正方形，顶点 $P$ 到底面中心 $O$ 的距离为 $h$，点 $E$ 为棱 $PC$ 上一点，满足 $PE : EC = 1 : 2$。

1. 求正四棱锥 $P$-$ABCD$ 的体积；\\
2. 过点 $E$ 作平面 $\pi$ 平行于底面，截棱锥，求该截面与棱锥交成的截面图形及面积；\\
3. 若点 $F$ 为边 $AB$ 中点，连线 $EF$ 是否在截面内？请说明理由。
  `;

  const handleSubmit = () => {
    alert("你的答案已提交：\n" + answer);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="shadow-2xl">
        <CardContent className="text-lg space-y-4">
          <h1 className="text-2xl font-bold mb-2">高中几何体题目</h1>
          <Latex>{problemLatex}</Latex>

          {/* 几何图形显示区域 */}
          <div className="aspect-video w-full border rounded-xl overflow-hidden shadow-md">
            <iframe
              title="几何图形演示"
              src="https://www.geogebra.org/material/iframe/id/yyt4fwbz/width/800/height/600/border/888888/rc/false/ai/false/sdz/true"
              width="100%"
              height="100%"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">你的解答</h2>
          <Textarea
            placeholder="请在此输入你的解答..."
            rows={10}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <Button onClick={handleSubmit}>提交答案</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeometryProblemPage;
