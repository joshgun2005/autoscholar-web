import { type LucideIcon } from "lucide-react";

export interface Endpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  scope: string;
  params?: Array<{ name: string; type: string; required: boolean; description: string }>;
  queryParams?: Array<{ name: string; type: string; default?: string; description: string }>;
  bodyParams?: Array<{ name: string; type: string; required: boolean; description: string }>;
  exampleResponse?: string;
}

export interface EndpointGroup {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  basePath: string;
  endpoints: Endpoint[];
}
