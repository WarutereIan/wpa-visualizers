export type DataRow = Record<string, string | number | boolean | null>

export interface ConnectorContext {
  endpointUrl: string | null
  credentials: Record<string, string>
}

export interface ConnectorAdapter {
  fetchRows(ctx: ConnectorContext): Promise<DataRow[]>
}
