import { useContext, useState, useCallback, useEffect} from "react"
import { ViewerContext } from "../../contexts"
import DetectSetting from "./DetectSetting"

const ControlModel = ({ isShow }) => {
    const dataDetectLocal = JSON.parse(localStorage.getItem('materialColorList') as string)
    const [dataDetect, setDataDetact] = useState('')
    const [postData, setPostData] = useState([])

    const { modelLoader, isSetting, setIsSetting, setLoaded, setIsModaling } = useContext(ViewerContext)

    useEffect(() => {
        if(isSetting){
            setDataDetact(dataDetectLocal)
        }
    }, [isSetting])


    if (!isShow)
        return null

    const handlePostData = () => {
        setIsSetting(false)
        setLoaded(false)
        setIsModaling(true)
        setTimeout(() => {
            localStorage.setItem('materialColorList', JSON.stringify(postData))
            const rebarMesh = modelLoader?.getElement().reinforcingBarMesh
            if(rebarMesh) {
                modelLoader?.detectRebarAndVoxel(rebarMesh)
            }
            setLoaded(true)

        }, 100)
        
        console.log(postData)
    }


    return (
        <div className={`modal fade ${isSetting ? 'show' : ''}`} style={{ display: `${isSetting ? 'block' : 'none'}` }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Config Setting</h5>
                        <button type="button" className="btn-close" onClick={() => setIsSetting(false)}></button>
                    </div>
                    <div className="modal-body">
                        <DetectSetting dataDetect={dataDetect} callBack={(value) => setPostData(value)} isSetting={isSetting} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsSetting(false)}>Close</button>
                        <button type="button" className="btn btn-primary" onClick={() => handlePostData()}>Detect</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ControlModel