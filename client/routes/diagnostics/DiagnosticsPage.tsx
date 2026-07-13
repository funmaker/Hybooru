import React, { useCallback, useState } from 'react';
import { toast } from "react-toastify";
import { DiagnosticsRequest, DiagnosticsResponse, SQLQueryPlan } from "../../../server/routes/apiTypes";
import { fixedFormatTime } from "../../../server/helpers/utils";
import { classJoin } from "../../helpers/utils";
import requestJSON from "../../helpers/requestJSON";
import useAsyncCallback from "../../hooks/useAsyncCallback";
import Spinner from "../../components/Spinner";
import Layout from "../../components/Layout";
import SSRCurtain from "../../components/SSRCurtain";
import "./DiagnosticsPage.scss";

interface FormFields {
  password: string;
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [selected, setSelected] = useState<SQLQueryPlan | null>(null);
  
  const [onSubmit, fetching] = useAsyncCallback(async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    
    const { password } = Object.fromEntries(new FormData(ev.currentTarget)) as unknown as FormFields;
    
    const response = await requestJSON<DiagnosticsResponse, DiagnosticsRequest>({
      url: "/api/diagnostics",
      method: "POST",
      data: { password },
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "X-Hybooru-No-Auth": true,
      },
    });
    
    setSelected(null);
    setDiagnostics(response);
  }, []);
  
  const onOpenFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.addEventListener("change", async ev => {
      const file = (ev.target as HTMLInputElement).files![0];
      if(!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", async () => {
        try {
          const json = JSON.parse(reader.result as string);
          if(typeof json !== "object" || !json.stats || !json.benchmark) throw new Error("Invalid JSON");
          setSelected(null);
          setDiagnostics(json);
          toast.success(`Read diagnostics data from ${file.name}`);
        } catch(e) {
          console.error(e);
          console.error("Read: ", reader.result);
          toast.error("Doesn't seem to be valid diagnostics json.");
        }
      });
      reader.readAsText(file);
    });
    input.click();
  }, []);
  
  const onLoadClipboard = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    try {
      const json = JSON.parse(text);
      if(typeof json !== "object" || !json.stats || !json.benchmark) throw new Error("Invalid JSON");
      setSelected(null);
      setDiagnostics(json);
      toast.success("Read diagnostics data from clipboard");
    } catch(e) {
      console.error(e);
      console.error("Read: ", text);
      toast.error("Doesn't seem to be valid diagnostics json.");
    }
  }, []);
  
  const onDownloadAll = useCallback(() => {
    const a = document.createElement("a");
    const file = new Blob([JSON.stringify(diagnostics)], { type: "application/json" });
    a.href = URL.createObjectURL(file);
    a.download = "diagnostics.json";
    a.click();
  }, [diagnostics]);
  
  const onCopyAll = useCallback(() => copyText("Diagnostics data", JSON.stringify(diagnostics)), [diagnostics]);
  
  return (
    <Layout className="DiagnosticsPage">
      <div className="wrap">
        <div className="left">
          <h2>Diagnostics</h2>
          <p>
            This process might take several minutes during which the rest of the app will not be accessible.
            Do not refresh this page nor restart it while the process is still ongoing. If it&apos;s stuck/taking to long,
            just restart hybooru. Check stdout if in doubt, it should print the progress in real time.
          </p>
          
          <noscript>JS is required on this page</noscript>
          
          <SSRCurtain>
            <form className="fetchRow" onSubmit={onSubmit}>
              <input placeholder="Admin Password" name="password" type="password" disabled={fetching} />
              <button disabled={fetching}>Run Diagnostics</button>
              <button disabled={fetching} type="button" onClick={onOpenFile}>Open File</button>
              <button disabled={fetching} type="button" onClick={onLoadClipboard}>From Clipboard</button>
            </form>
            
            {diagnostics && (
              <div className="buttons">
                <button onClick={onDownloadAll}>Download All</button>
                <button onClick={onCopyAll}>Copy To Clipboard</button>
              </div>
            )}
          </SSRCurtain>
          
          {fetching && <Spinner />}
          
          {diagnostics && (
            <div className="tableWrap">
              <BenchmarkTable diagnostics={diagnostics} selected={selected} onSelect={setSelected} />
            </div>
          )}
        </div>
        <div className="right">
          {diagnostics && selected && <PlanDetails diagnostics={diagnostics} plan={selected} />}
        </div>
      </div>
    </Layout>
  );
}

interface BenchmarkTableProps {
  diagnostics: DiagnosticsResponse;
  selected?: SQLQueryPlan | null;
  onSelect?: (plan: SQLQueryPlan) => void;
}

function BenchmarkTable({ diagnostics, selected, onSelect }: BenchmarkTableProps) {
  const sizes = diagnostics.benchmark._SIZES || [];
  
  return (
    <table className="BenchmarkTable">
      <thead>
        <tr>
          <th></th>
          {sizes.map((size, id) => <th key={id}>{size}</th>)}
        </tr>
      </thead>
      <tbody>
        {Object.entries(diagnostics.benchmark)
               .filter(([name]) => name != "_SIZES")
               .map(([name, plans]) => (
                 <tr key={name}>
                   <td>{name}</td>
                   {plans.map((plan, id) => <PlanCell key={id} plan={plan} selected={plan === selected} onSelect={onSelect} />)}
                 </tr>
               ))}
        <tr><td>&nbsp;</td></tr>
        <tr><td>Posts</td><td colSpan={sizes.length} className="left">{diagnostics.stats.posts}</td></tr>
        <tr><td>Tags</td><td colSpan={sizes.length} className="left">{diagnostics.stats.tags}</td></tr>
        <tr><td>Mappings</td><td colSpan={sizes.length} className="left">{diagnostics.stats.mappings}</td></tr>
      </tbody>
    </table>
  );
}

interface PlanCellProps {
  plan: SQLQueryPlan;
  selected?: boolean;
  onSelect?: (plan: SQLQueryPlan) => void;
}

function PlanCell({ plan, selected, onSelect }: PlanCellProps) {
  const onClick = useCallback(() => onSelect?.(plan), [onSelect, plan]);
  
  return (
    <td className={classJoin("clickable", selected && "selected")}
        tabIndex={0}
        onClick={onClick}>
      <TimeSpan ms={plan["Execution Time"]} />
    </td>
  );
}

interface TimeSpanProps {
  ms: number;
}

function TimeSpan({ ms }: TimeSpanProps) {
  const text = fixedFormatTime(ms);
  
  let color = "cyan";
  if(typeof ms === "number") {
    if(ms < 100) color = "green";
    else if(ms < 1000) color = "yellow";
    else color = "red";
  }
  
  return <span className={classJoin("TimeSpan", color)}>{text}</span>;
}

interface PlanDetailsProps {
  diagnostics: DiagnosticsResponse;
  plan: SQLQueryPlan;
}

function PlanDetails({ diagnostics, plan }: PlanDetailsProps) {
  const selectedName: string | null =
    Object.entries(diagnostics.benchmark)
          .flatMap(([name, plans]) =>
            plans.includes(plan)
              ? [name + (plans.length > 1 ? ` (${diagnostics.benchmark._SIZES[plans.indexOf(plan)]})` : "")]
              : [],
          )[0];
  
  const params = plan.QueryParams ?? [];
  let query: string = plan.Query ?? "";
  query = query.replace(/\$(\d+)/g, (match, indexStr) => formatLiteral(params[parseInt(indexStr, 10) - 1]));
  query = query.trimEnd();
  if(!query.endsWith(";") && query) query += ";";
  
  const queryPlan = JSON.stringify(plan, null, 4);
  
  const onCopyQuery = useCallback(() => copyText("Query", query), [query]);
  const onCopyPlan = useCallback(() => copyText("Query Plan", queryPlan), [queryPlan]);
  
  return (
    <Layout className="PlanDetails" plain>
      <h3>{selectedName}</h3>
      <div className="stats">
        <div className="row">
          <label>Execution Time:</label>
          <TimeSpan ms={plan["Execution Time"]} />
        </div>
        <div className="row">
          <label>Planning Time:</label>
          <TimeSpan ms={plan["Planning Time"]} />
        </div>
        {plan.Error && (
          <div className="row">
            <label>Error:</label>
            <span className="errorMessage">{plan.Error.message}</span>
          </div>
        )}
      </div>
      <div className="buttons">
        <button onClick={onCopyQuery}>Copy Query</button>
        <button onClick={onCopyPlan}>Copy Plan</button>
      </div>
      <textarea disabled value={query} />
      <textarea disabled value={queryPlan} />
    </Layout>
  );
}

function formatLiteral(value: any): string {
  if(value === null || value === undefined) return "NULL";
  switch(typeof value) {
    case 'number': return value.toString();
    case 'boolean': return value ? 'TRUE' : 'FALSE';
    case 'string': return `'${value.replace(/'/g, "''")}'`;
    case 'object': {
      if(Array.isArray(value)) return `ARRAY[${value.map(item => formatLiteral(item)).join(', ')}]`;
      else if(value instanceof Date) return `'${value.toISOString()}'::timestamp`;
      else return `${formatLiteral(JSON.stringify(value))}::jsonb`;
    }
    default:
      throw new Error(`Unsupported parameter type: ${typeof value}`);
  }
}

async function copyText(name: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${name} copied to clipboard!`);
  } catch(err) {
    console.error(err);
    toast.error(`Failed to copy to clipboard: ${err}`);
  }
}
