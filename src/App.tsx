import { useState, ChangeEvent, MouseEvent } from 'react';
import ReactJson from 'react-json-view';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

function App() {
  const [jsonInput, setJsonInput] = useState<string>('{"name": "Leandro", "role": "Software Engineer"}');
  const [htmlInput, setHtmlInput] = useState<string>('<p>Hello Dev!</p>');
  const [tsInterfaces, setTsInterfaces] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'jsonPreview' | 'tsGenerator' | 'htmlPreview'>('jsonPreview');
  const [isJsonPreview, setIsJsonPreview] = useState<boolean>(false);

  const handleGenerateTs = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const { result, interfaces } = generateTsInterfaces(parsed);
      setTsInterfaces([result, ...interfaces].join('\n'));
    } catch (error) {
      setTsInterfaces('Invalid JSON');
    }
  };

  const generateTsInterfaces = (
    obj: any, 
    interfaceName: string = 'Root', 
    interfaceSet: Map<string, any> = new Map()
  ): { result: string, interfaces: string[] } => {
    let result = `interface I${interfaceName} {\n`;
    let subInterfaces: string[] = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const type = getType(value);
        
        if (type === 'object') {
          const subInterfaceName = capitalizeFirstLetter(key);
          if (!interfaceSet.has(subInterfaceName)) {
            const { result: subResult, interfaces: subInterfacesResult } = generateTsInterfaces(value, subInterfaceName, interfaceSet);
            result += `  ${key}: ${subInterfaceName};\n`;
            subInterfaces.push(subResult);
            interfaceSet.set(subInterfaceName, value);
            subInterfaces = [...subInterfaces, ...subInterfacesResult];
          } else {
            result += `  ${key}: ${subInterfaceName};\n`;
          }
        } else if (type === 'array' && value.length > 0 && typeof value[0] === 'object') {
          const subInterfaceName = capitalizeFirstLetter(key);
          if (!interfaceSet.has(subInterfaceName)) {
            const { result: subResult, interfaces: subInterfacesResult } = generateTsInterfaces(value[0], subInterfaceName, interfaceSet);
            result += `  ${key}: ${subInterfaceName}[];\n`;
            subInterfaces.push(subResult);
            interfaceSet.set(subInterfaceName, value[0]);
            subInterfaces = [...subInterfaces, ...subInterfacesResult];
          } else {
            result += `  ${key}: ${subInterfaceName}[];\n`;
          }
        } else {
          result += `  ${key}: ${type};\n`;
        }
      }
    }

    result += `}\n`;
    return { result, interfaces: subInterfaces };
  };

  const getType = (value: any): string => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    return typeof value;
  };

  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleViewJson = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    try {
      JSON.parse(jsonInput);
      setIsJsonPreview(true);
    } catch (error) {
      alert('Invalid JSON');
    }
  };

  const handleEditJson = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    setIsJsonPreview(false); 
  };


  const filterHtml = (html: string): string => {

    const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyContentMatch ? bodyContentMatch[1] : html;
  
    return bodyContent
      .replace(/<html[^>]*>|<\/html>/gi, '')
      .replace(/<head[^>]*>([\s\S]*?)<\/head>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  };
  

  return (
    <div>
      <div className="tabs">
        <div
          onClick={() => setActiveTab('jsonPreview')}
          className={`tab ${activeTab === 'jsonPreview' ? 'active' : ''}`}
        >
          JSON Preview
        </div>
        <div
          onClick={() => setActiveTab('tsGenerator')}
          className={`tab ${activeTab === 'tsGenerator' ? 'active' : ''}`}
        >
          TS Interface Generator
        </div>
        <div
          onClick={() => setActiveTab('htmlPreview')}
          className={`tab ${activeTab === 'htmlPreview' ? 'active' : ''}`}
        >
          HTML Preview
        </div>
      </div>

      {activeTab === 'jsonPreview' && (
        <div className="section">
          <h2>JSON Preview</h2>
          {!isJsonPreview ? (
            <div>
              <textarea
                value={jsonInput}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
                placeholder="Paste or type your JSON here"
              />
              <br />
              <button onClick={handleViewJson}>View JSON</button>
            </div>
          ) : (
            <div>
              <ReactJson
                quotesOnKeys={false}
                style={{ padding: 20 }}
                src={JSON.parse(jsonInput)}
                collapsed={true}
                name={false}
                theme="colors"
                enableClipboard={true}
                displayDataTypes={false}
              />
              <br />
              <button onClick={handleEditJson}>Edit JSON</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tsGenerator' && (
        <div className="section">
          <h2>Generate TypeScript Interface</h2>
          <button onClick={handleGenerateTs}>Generate Interface</button>
          <h3>TypeScript Interface</h3>
          <SyntaxHighlighter language="typescript" style={vscDarkPlus} customStyle={{ minHeight: 400 }}>
            {tsInterfaces}
          </SyntaxHighlighter>
        </div>
      )}

      {activeTab === 'htmlPreview' && (
        <div className="section">
          <h2>HTML Preview</h2>
          <textarea
            value={htmlInput}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHtmlInput(e.target.value)}
            placeholder="Write your HTML here"
          />
          <h3>Rendered HTML</h3>
          <div
            className="html-preview"
            dangerouslySetInnerHTML={{ __html: filterHtml(htmlInput) }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
