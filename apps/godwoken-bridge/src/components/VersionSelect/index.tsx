import { Select } from "antd";
import { Placement } from "rc-select/lib/generate";
import { useParams, useNavigate } from "react-router-dom";
import { availableVersions } from "../../utils/environment";

const { Option } = Select;

export interface VersionSelectProps {
  placement?: Placement;
}

export function VersionSelect(props: VersionSelectProps) {
  const params = useParams();
  const navigate = useNavigate();
  function handleChange(value: string) {
    navigate(`/${value}/${params["*"]}`);
  }

  return (
    <Select
      style={{ width: 160, marginLeft: "10px", marginRight: "10px" }}
      getPopupContainer={(node) => node}
      placement={props.placement}
      value={params.version}
      onChange={handleChange}
    >
      {availableVersions.map((version) => (
        <Option value={version} key={version}>
          Godwoken {version.toUpperCase()}
        </Option>
      ))}
    </Select>
  );
}
