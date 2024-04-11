import React, {ChangeEvent, useRef} from 'react';
import './DragAndDrop.css'
import UploadIcon from "../UploadIcon";

type DragAndDropProps = {
    onChangeFile: (file: File) => void
    isShow: boolean
    accept?: string
}

const DragAndDrop : React.FC<DragAndDropProps> = ({onChangeFile, isShow, accept="*"}) => {
    const dropRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (dropRef.current) {
            dropRef.current?.classList.remove('dropdown-file-none')
            dropRef.current?.classList.add('dropdown-file-hover')
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (dropRef.current) {
            dropRef.current?.classList.remove('dropdown-file-hover')
            dropRef.current?.classList.add('dropdown-file-none')
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (dropRef.current) {
            dropRef.current?.classList.remove('dropdown-file-none')
            dropRef.current?.classList.add('dropdown-file-hover')
        }
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            if (droppedFiles.length > 1) {
                alert('Only one file can be uploaded!')
            } else {
                onChangeFile(droppedFiles[0])
            }
        }
    };

    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            onChangeFile(file)
        }
    };

    const handleChooseFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    if (!isShow) return null;
    return (
        <div
            ref={dropRef}
            className='dropdown-file dropdown-file-none'
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleChooseFile}
        >
            <input
                type="file"
                ref={fileInputRef}
                accept={accept}
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
            />

            <UploadIcon style={{marginBottom: 12}} color='#ffffff' width={100} height={100}/>
            <p>Click to upload or drag and drop</p>
        </div>
    );
};

export default DragAndDrop;