import { useEffect, useState } from "react";
import Ranger from "./Components/Ranger";
import { DataDetectItemProps, DataDetectProps } from "..";

const defaultColor: string[] = [
  '#0000FF',
  '#5d9ee3',
  '#00FFFF',
  '#27d6a4',
  '#3bed0e',
  '#008000',
  '#FFFF00',
  '#cf8d1d',
  '#FFA500',
  '#FF0000',
]



type DetectSettingProps = {
  dataDetect: DataDetectProps | undefined,
  callBack: (value: DataDetectItemProps[] | undefined) => void,
  isSetting: boolean | undefined
}

const DetectSetting :React.FC<DetectSettingProps> = ({ dataDetect, callBack, isSetting }) => {
  const [listPoint, setListPoint] = useState<number[]>([])
  const [listColor, setListColor] = useState<string[]>([])
  const [numberRange, setNumberRange] = useState<number>(0)

  useEffect(() => {
    const listLastPoint: number[] = []
    if (dataDetect && isSetting) {
      dataDetect.forEach((item) => {
        if (item.ratio.max !== 100)
          listLastPoint.push(item.ratio.max)
      })
      setNumberRange(listLastPoint.length + 1)
      setListPoint(listLastPoint)
      setListColor(dataDetect?.map((item) => item.color))
    }
  }, [dataDetect, isSetting])

  useEffect(() => {
    const postData: DataDetectItemProps[] = []
    const newList = [...listPoint]
    newList.push(100)
    newList.forEach((item, index) => {
      if (index === 0) {
        postData.push({
          color: listColor[index],
          label: `0% - ${item}%`,
          ratio: {
            min: 0,
            max: item
          }
        })
      }
      else if (index <= newList.length - 1) {
        postData.push({
          color: index === newList.length - 1 ? listColor[listColor.length - 1] : listColor[index],
          label: `${listPoint[index - 1]}% - ${item}%`,
          ratio: {
            min: listPoint[index - 1],
            max: item
          }
        })
      }
    })

    callBack(postData)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPoint])

  const handleNumberRange = (value: number) => {
    const listLastPoint: number[] = []
    const listLastColor: string[] = []
    const range = value
    if (range > 0) {
      for (let i = 1; i <= range; i++) {
        if (range !== i)
          listLastPoint.push(Number((100 / range * i).toFixed(0)))
        if (i === range) {
          listLastColor.push(defaultColor[defaultColor.length - 1])
        } else {
          listLastColor.push(defaultColor[i - 1])
        }
      }

      setListPoint(listLastPoint)
      setListColor(listLastColor)
      setNumberRange(value)
    } else {
      setNumberRange(value)
    }
  }

  return (
    <div className="detect-setting">
      <div className="d-flex number-range">
        <div>number of range</div>:
        <select className="form-select"
                onChange={(e) => handleNumberRange(Number(e.target.value))}
                value={numberRange}
        >
          {defaultColor.map((_, index) => {
            if (index === 0) {
              return (
                <option key={index} value={index}>select range option</option>
              )
            } else {
              return (
                <option key={index} value={index + 1}>{index + 1}</option>
              )
            }
          })}
        </select>
      </div>
      {numberRange > 0 && <Ranger listPoint={listPoint} listColor={listColor} setListPoint={setListPoint} />}
    </div>
  );
}

export default DetectSetting;
