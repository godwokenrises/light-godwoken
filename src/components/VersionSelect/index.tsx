import { Select } from "antd";
import React, { useEffect } from "react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
const { Option } = Select;
export const VersionSelect: React.FC = () => {
  const [version, setVersion] = useState<string>();
  const params = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    if (params.version) {
      setVersion(params.version.toString());
    }
  }, [params.version]);

  const handleChange = (value: string) => {
    setVersion(value);
    navigate(`/${value}`);
  };
  return (
    <Select style={{ width: 160, marginLeft: "10px", marginRight: "10px" }} value={version} onChange={handleChange}>
      <Option value="v0">Godwoken V0</Option>
      <Option value="v1">Godwoken V1</Option>
    </Select>
  );
};
