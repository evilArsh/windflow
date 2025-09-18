import { Tiktoken } from "js-tiktoken/lite"
import cl100k_base from "js-tiktoken/ranks/cl100k_base"

/**
https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb

```md
o200k_base  gpt-4o, gpt-4o-mini
cl100k_base gpt-4-turbo, gpt-4, gpt-3.5-turbo, text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large
```
 */
export const encoding = new Tiktoken(cl100k_base)
