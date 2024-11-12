// InfoBox.js
import React, { useState } from 'react';
import ProjectView from './projectView';
import SenarioView from './senarioView';

const InfoBox = ({ layer, layerState, setState }) => {
  const [activeTab, setActiveTab] = useState('project');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="py-6 px-4 sm:px-2 mt-5" style={{ zIndex: 100 }}>
      <div className="flex justify-left mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'project' ? 'bg-gray-200' : ''}`}
          onClick={() => handleTabChange('project')}
        >
          Project View
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'senario' ? 'bg-gray-200' : ''}`}
          onClick={() => handleTabChange('senario')}
        >
          Senario View
        </button>
      </div>
      {activeTab === 'project' && (
        <ProjectView
          projectId={layer.projectId}
          layer={layer}
          selectedBlockGroups={layerState.selectedBlockGroups}
          bgIds={layerState.bgsGeometryIds}
        />
      )}
      {activeTab === 'senario' && (
        <SenarioView
          projectId={layer.projectId}
          layer={layer}
          layerState={layerState}
          setState={setState}
        />
      )}
    </div>
  );
};

export default InfoBox;