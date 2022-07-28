import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Select } from "antd";
const { Option } = Select;

export const VersionSelect: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  function handleChange(value: string) {
    navigate(`/${value}/${params["*"]}`);
  }

  return (
    <Select style={{ width: 160, marginLeft: "10px", marginRight: "10px" }} value={params.version} onChange={handleChange}>
      <Option value="v0">Godwoken V0</Option>
      <Option value="v1">Godwoken V1</Option>
    </Select>
  );
};
