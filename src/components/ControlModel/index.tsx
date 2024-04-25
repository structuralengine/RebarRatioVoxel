import { useContext, useState, useCallback} from "react"
import { ViewerContext } from "../../contexts"
import DetectSetting from "./DetectSetting"

const materialColorlist = [
    { color: '#00d4ff', label: '0% - 15%', ratio: { min: 0, max: 15 }, quantity: 0 },
    { color: '#09e8cd', label: '15% - 50%', ratio: { min: 15, max: 50 }, quantity: 0 },
    { color: '#e8de09', label: '80% - 100%', ratio: { min: 50, max: 80 }, quantity: 0 },
    { color: '#dd1b1b', label: '80% - 100%', ratio: { min: 80, max: 100 }, quantity: 0 },
]

const ControlModel = ({ isShow }) => {
    const [dataDetect, setDataDetact] = useState(materialColorlist)
    const [postData, setPostData] = useState([])

    const { modelLoader, isSetting, setIsSetting, setLoaded } = useContext(ViewerContext)

    if (!isShow)
        return null

    const handlePostData = () => {
        setIsSetting(false)
        setLoaded(false)
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
                        <h5 className="modal-title">Control settings</h5>
                        <button type="button" className="btn-close" onClick={() => setIsSetting(false)}></button>
                    </div>
                    <div className="modal-body">
                        <DetectSetting dataDetect={dataDetect} callBack={(value) => setPostData(value)} isSetting={isSetting} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsSetting(false)}>Close</button>
                        <button type="button" className="btn btn-primary" onClick={() => handlePostData()}>Accept</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ControlModel