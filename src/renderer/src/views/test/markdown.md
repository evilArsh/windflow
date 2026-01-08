```json
{
  "pnpm": {
    "overrides": {
      "decode-named-character-reference": "file:./path/to/your-implementation"
    }
  }
}
```

根据你的依赖树， 被多个 markdown 处理相关的包使用。要让所有依赖使用你指定的实现，有几种方法：

## 方法一：使用 pnpm 的 overrides（推荐）

在 `package.json` 中添加 `pnpm.overrides`：

```json
{
  "pnpm": {
    "overrides": {
      "decode-named-character-reference": "file:./path/to/your-implementation"
    }
  }
}
```
