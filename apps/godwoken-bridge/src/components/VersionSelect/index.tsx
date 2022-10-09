import React from "react";
import { Select } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { availableVersions } from "../../utils/environment";

const { Option } = Select;

export const VersionSelect: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  function handleChange(value: string) {
    navigate(`/${value}/${params["*"]}`);
  }

  return (
    <Select
      style={{ width: 160, marginLeft: "10px", marginRight: "10px" }}
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
};
