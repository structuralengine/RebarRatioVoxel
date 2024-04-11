import React from 'react';
import '../../styles/Viewer.css'

type ModelLoadingProps = {
    isShow: boolean
}
const ModelLoading :React.FC<ModelLoadingProps> = ({isShow}) => {
    if (!isShow) return null;
    return (
        <div className='loading'>
            <h2 className='loading-title'>Model loading...</h2>
            <p className='loading-description'>Please wait a few minute</p>
        </div>
    );
};

export default ModelLoading;