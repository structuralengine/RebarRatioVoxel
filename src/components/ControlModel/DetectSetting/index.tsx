import { useContext, useEffect, useState } from "react";
import Ranger from "./Components/Ranger";
import { ViewerContext } from "../../../contexts";

export const defaultColor = [
  '#52d726',
  '#ffaf00',
  '#ff7300',
  '#7bdddc',
  '#dd1b79',
  '#c758d0',
  '#9b46ce',
  '#8d6cef',
  '#8399ec',
  '#dd1b1b',
]

const DetectSetting = ({ dataDetect, callBack, isSetting }) => {
  const [listPoint, setListPoint] = useState([])
  const [listColor, setListColor] = useState([])
  const [numberRange, setNumberRange] = useState<string>('0')

  useEffect(() => {
    // debugger
    const listLastPoint: any = []
    if (dataDetect && isSetting) {
      dataDetect.forEach((item: any) => {
        if (item.ratio.max !== 100)
          listLastPoint.push(item.ratio.max)
      })
      setNumberRange((listLastPoint.length + 1).toString())
      setListPoint(listLastPoint)
      setListColor(dataDetect.map((item: any) => item.color))
    }
  }, [dataDetect, isSetting])

  useEffect(() => {
    const postData: any = []
    const newList = [...listPoint]
    newList.push('100')
    console.log(newList)
    newList.forEach((item, index) => {
      if (index === 0) {
        postData.push({
          color: listColor[index],
          label: `0% - ${item}%`,
          ratio: {
            min: 0,
            max: parseInt(item)
          }
        })
      }
      else if (index <= newList.length - 1) {
        postData.push({
          color: index === newList.length - 1 ? listColor[listColor.length - 1] : listColor[index],
          label: `${listPoint[index - 1]}% - ${item}%`,
          ratio: {
            min: parseInt(listPoint[index - 1]),
            max: parseInt(item)
          }
        })
      }
    })

    callBack(postData)
  }, [listPoint])

  const handleNumberRange = (value) => {
    const listLastPoint: any = []
    const listLastColor: any = []
    const range = parseInt(value)
    if (range > 0) {
      for (let i = 1; i <= range; i++) {
        if (range !== i)
          listLastPoint.push((100 / range * i).toFixed(0))
        if (i === range) {
          listLastColor.push(defaultColor[defaultColor.length - 1])
        } else {
          listLastColor.push(defaultColor[i - 1])
        }
      }

      setListPoint(listLastPoint)
      setListColor(listLastColor)
      setNumberRange(value)
    }
  }

  return (
    <div className="detect-setting">
      <div className="d-flex number-range">
        <div>number of range</div>:
        <select className="form-select" aria-label="Default select example" onChange={(e) => handleNumberRange(e.target.value)} value={numberRange}>
          {defaultColor.map((_, index) => {
            if (index === 0) {
              return (
                <option value={index}>select range option</option>
              )
            } else {
              return (
                <option value={index + 1}>{index + 1}</option>
              )
            }
          })}
        </select>
      </div>
      {parseInt(numberRange) > 0 && <Ranger listPoint={listPoint} listColor={listColor} setListPoint={setListPoint} />}
    </div>
  );
}

export default DetectSetting;
