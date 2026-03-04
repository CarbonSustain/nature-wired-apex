import PptxGenJS from 'pptxgenjs';
const pptx = new PptxGenJS();

export default function ProjectCard({ project, onAdd }) {
    return (
      <div className="border rounded p-4 flex flex-col items-center">
        <div className="w-32 h-20 bg-gray-200 mb-2" />
        <div className="font-bold">{project.name}</div>
        <div className="text-sm text-gray-600 mb-2">{project.summary}</div>
        <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => onAdd(project)}>
          Add Project
        </button>
      </div>
    );
  }