import { useContext, useState, useEffect} from "react"
import { ViewerContext } from "../../contexts"
import DetectSetting from "./DetectSetting"

type ControlModelProps = {
    isShow: boolean | undefined
}

export type DataDetectItemProps = {
    color: string,
    label: string,
    ratio: {
        min: number,
        max: number,
    },
    quantity?: number,
}

export type DataDetectProps = [DataDetectItemProps] | []

const ControlModel :React.FC<ControlModelProps> = ({ isShow }) => {
    const dataDetectLocal = JSON.parse(localStorage.getItem('materialColorList') as string)
    const [dataDetect, setDataDetact] = useState<DataDetectProps | undefined>(undefined)
    const [postData, setPostData] = useState<DataDetectItemProps[] | undefined>(undefined)

    const { modelLoader, isSetting, setIsSetting, setLoaded, setIsModaling } = useContext(ViewerContext)

    useEffect(() => {
        if(isSetting){
            setDataDetact(dataDetectLocal)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        <DetectSetting dataDetect={dataDetect} callBack={(value: DataDetectItemProps[] | undefined) => setPostData(value)} isSetting={isSetting} />
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