export const mentionRegex = /(@\[[^\]]+\]|<#[\p{L}\d\s_-]+>)/gu;
export const mentionRegexSplit = /(@\[[^\]]+\]|<#(?:[\p{L}\d\s_-]+)>|:[\p{L}\d _-]+:|\w+|[^\w\s])/gu;
export const mentionSerializedRegex = /\{@\}\[([^\]]+)\]\(([^)]+)\)/g
