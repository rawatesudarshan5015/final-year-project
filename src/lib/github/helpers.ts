import { ResourceMetadata } from "./types";

/**
 * Constructs a path for GitHub resources based on the provided metadata
 */
export function constructPath(metadata: Partial<ResourceMetadata>): string {
  const parts = [];
  if (metadata.pattern) parts.push(metadata.pattern);
  if (metadata.year) parts.push(metadata.year);
  if (metadata.semester) parts.push(`Sem${metadata.semester}`);
  if (metadata.examType) parts.push(metadata.examType);
  if (metadata.resourceType) parts.push(metadata.resourceType);
  if (metadata.subject) parts.push(metadata.subject);

  return parts.join("/");
} 