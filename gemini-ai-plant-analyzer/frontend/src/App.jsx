import React,{useState} from "react";

const API="http://localhost:5001/api";

export default function App(){
  const [file,setFile]=useState(null),[preview,setPreview]=useState(""),[result,setResult]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState("");

  const choose=e=>{
    const f=e.target.files?.[0];
    if(!f || !f.type.startsWith("image/")) return setError("Choose a valid image.");
    setError("");setResult(null);setFile(f);
    const reader=new FileReader();reader.onload=()=>setPreview(reader.result);reader.readAsDataURL(f);
  };

  const analyze=()=>{
    if(!file)return setError("Upload a plant image first.");
    setLoading(true);setError("");
    const reader=new FileReader();
    reader.onload=async()=>{
      try{
        const image=reader.result.split(",")[1];
        const r=await fetch(`${API}/analyze`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image,mimeType:file.type})});
        const data=await r.json();
        if(!r.ok)throw new Error(data.message||"Analysis failed");
        setResult(data);
      }catch(e){setError(e.message)}finally{setLoading(false)}
    };
    reader.readAsDataURL(file);
  };

  const list=(title,items)=><div className="box"><h3>{title}</h3><ul>{(items?.length?items:["No information available."]).map((x,i)=><li key={i}>{x}</li>)}</ul></div>;

  return <div className="app">
    <header><h1>🌱 Gemini AI Plant Analyzer</h1><p>Upload a plant image for AI-powered identification and health analysis</p></header>
    <main>
      <section className="card">
        <h2>Upload Plant Image</h2>
        <label className="upload">📷 Choose JPG, PNG or WEBP<input type="file" accept="image/*" onChange={choose}/></label>
        {preview&&<img className="preview" src={preview} alt="Plant preview"/>}
        <div className="actions"><button className="primary" onClick={analyze} disabled={loading}>{loading?"Analyzing...":"🔍 Analyze Plant"}</button><button onClick={()=>{setFile(null);setPreview("");setResult(null);setError("")}}>Clear</button></div>
        {loading&&<p className="loading">Gemini AI is analyzing the image...</p>}
        {error&&<div className="error">{error}</div>}
      </section>

      {result&&<section className="card">
        <div className="hero"><h2>{result.plantName||"Unknown Plant"}</h2><div className="score">{result.healthScore??"--"}/100</div><p>{result.healthStatus||"Health status unavailable"}</p></div>
        <div className="grid">
          <div className="box"><h3>🌱 Plant Name</h3><p>{result.plantName}</p></div>
          <div className="box"><h3>🔬 Scientific Name</h3><p>{result.scientificName}</p></div>
          <div className="box"><h3>🦠 Disease / Problem</h3><p>{result.disease}</p></div>
          <div className="box"><h3>☀️ Sunlight</h3><p>{result.sunlight}</p></div>
          <div className="box"><h3>💧 Watering</h3><p>{result.watering}</p></div>
          <div className="box"><h3>🌡️ Temperature</h3><p>{result.temperature}</p></div>
          <div className="box"><h3>🌿 Soil</h3><p>{result.soil}</p></div>
          {list("Possible Causes",result.causes)}
          {list("Recommended Treatment",result.treatment)}
          {list("Plant Care Tips",result.careTips)}
          <div className="box"><h3>⚠️ Warning</h3><p>{result.warning}</p></div>
        </div>
      </section>}
    </main>
    <footer>Gemini AI Plant Analysis Tool • React • Node.js • Gemini API</footer>
  </div>
}
