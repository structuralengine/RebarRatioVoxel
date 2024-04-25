import { useEffect, useState } from "react";
import { useRanger } from "react-ranger";
import styled from "styled-components";

export const Track = styled("div")`
  display: inline-block;
  height: 8px;
  width: 90%;
  margin: 0 5%;
`;

export const Tick = styled("div")`
  :before {
    content: "";
    position: absolute;
    left: 0;
    background: rgba(0, 0, 0, 0.2);
    height: 5px;
    width: 2px;
    transform: translate(-50%, 0.7rem);
  }
`;

export const TickLabel = styled("div")`
  position: absolute;
  font-size: 0.6rem;
  color: #fff;
  top: 100%;
  transform: translate(-50%, 1.2rem);
  white-space: nowrap;
`;

export const Segment = styled("div")`
  background: ${props => props.listColor[props.index]};
  height: 100%;
`;

export const Handle = styled("div")`
  background: #ff1a6b;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 100%;
  font-size: 0.7rem;
  white-space: nowrap;
  color: white;
  font-weight: ${props => (props.active ? "bold" : "normal")};
  transform: ${props =>
        props.active ? "translateY(-100%) scale(1.3)" : "translateY(0) scale(0.9)"};
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;

const Ranger = ({ listColor, listPoint, setListPoint }) => {
    const [values, setValues] = useState([]);

    useEffect(() => {
        setValues(listPoint)
    }, [listPoint])

    const { getTrackProps, ticks, segments, handles } = useRanger({
        min: 0,
        max: 100,
        stepSize: 1,
        values,
        onChange: (values) => {
            setValues
            setListPoint(values)
        }
    });

    return (
        <div className="ranger">
            <Track {...getTrackProps()}>
                {ticks.map(({ value, getTickProps }) => (
                    <Tick {...getTickProps()}>
                        <TickLabel>{value}</TickLabel>
                    </Tick>
                ))}
                {segments.map(({ getSegmentProps }, i) => (
                    <Segment {...getSegmentProps()} index={i} listColor={listColor} />
                ))}
                {handles.map(({ value, active, getHandleProps }) => (
                    <button
                        {...getHandleProps({
                            style: {
                                appearance: "none",
                                border: "none",
                                background: "transparent",
                                outline: "none"
                            }
                        })}
                    >
                        <Handle active={active}>{value}</Handle>
                    </button>
                ))}
            </Track>
        </div>
    );
}

export default Ranger;
