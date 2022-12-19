import { Import } from "./import";

export default class Mappings extends Import {
  display = "Mappings";
  
  service = 0;
  inputTable = () => `current_mappings_${this.service}`;
  
  initialKey = [-1, -1];
  outputTable = "mappings";
  totalQuery = () => `SELECT count(1) FROM ${this.inputTable()}`;
  outputQuery = (table: string) => `COPY ${table}(postid, tagid) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      mappings.hash_id,
      mappings.tag_id,
      mappings.hash_id || ',' ||
      mappings.tag_id || '\n'
    FROM ${this.inputTable()} mappings
    WHERE (mappings.hash_id, mappings.tag_id) > (?, ?)
    ORDER BY mappings.hash_id, mappings.tag_id
    LIMIT ?
  `;
  
  async startEach(services: number[]) {
    const sizes = services.map(service => {
      this.resetTotal();
      this.service = service;
      return { service, total: this.total() };
    });
    
    sizes.sort((a, b) => b.total - a.total);
    
    for(const { service, total } of sizes) {
      if(total === 0) continue;
      
      this.resetTotal(total);
      this.service = service;
      
      await this.start();
      
      this.useTemp = true;
    }
  }
}
