/**
 * 데이터 미리보기 컴포넌트
 * Excel 데이터와 특수문자 변환 결과 표시
 */

import React from 'react';
import './DataPreview.css';

interface DataPreviewProps {
  tableData: any | null;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({ tableData, onNext, onBack, isLoading }) => {
  if (isLoading) {
    return (
      <div className="preview-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>데이터 처리 중...</p>
        </div>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="preview-container">
        <div className="no-data">
          <p>표시할 데이터가 없습니다</p>
          <button onClick={onBack} className="btn btn-secondary">
            다시 선택
          </button>
        </div>
      </div>
    );
  }

  const renderTable = () => {
    const { headers, rows } = tableData;
    const maxRows = 10; // 미리보기는 최대 10행만
    
    return (
      <div className="table-wrapper">
        <table className="preview-table">
          {headers && headers.length > 0 && (
            <thead>
              {headers.map((headerRow: any, rowIndex: number) => (
                <tr key={`header-${rowIndex}`}>
                  {headerRow.cells.map((cell: any, cellIndex: number) => (
                    <th 
                      key={`header-${rowIndex}-${cellIndex}`}
                      colSpan={cell.colspan || 1}
                      rowSpan={cell.rowspan || 1}
                    >
                      {cell.displayValue}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          )}
          <tbody>
            {rows.slice(0, maxRows).map((row: any, rowIndex: number) => (
              <tr key={`row-${rowIndex}`}>
                {row.cells.map((cell: any, cellIndex: number) => (
                  <td 
                    key={`cell-${rowIndex}-${cellIndex}`}
                    colSpan={cell.colspan || 1}
                    rowSpan={cell.rowspan || 1}
                    className={cell.type}
                  >
                    {cell.displayValue}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {rows.length > maxRows && (
          <p className="more-rows">
            ... 외 {rows.length - maxRows}행 더 있음
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="preview-container">
      <h2>📊 데이터 미리보기</h2>
      
      <div className="preview-info">
        <div className="info-item">
          <span className="label">총 행 수:</span>
          <span className="value">{tableData.totalRows}</span>
        </div>
        <div className="info-item">
          <span className="label">총 열 수:</span>
          <span className="value">{tableData.totalCols}</span>
        </div>
        {tableData.metadata && (
          <>
            <div className="info-item">
              <span className="label">인코딩:</span>
              <span className="value">{tableData.metadata.encoding}</span>
            </div>
            <div className="info-item">
              <span className="label">특수문자 변환:</span>
              <span className="value">{tableData.metadata.specialCharsConverted}개</span>
            </div>
          </>
        )}
      </div>

      {renderTable()}

      <div className="preview-notes">
        <h3>✨ 자동 처리 내역</h3>
        <ul>
          <li>특수문자 변환: ㈜ → (주), ① → (1) 등</li>
          <li>인코딩 최적화: UTF-8로 통일</li>
          <li>빈 행/열 제거: 불필요한 공백 정리</li>
          <li>셀 병합 처리: 복잡한 표 구조 유지</li>
        </ul>
      </div>

      <div className="button-group">
        <button onClick={onBack} className="btn btn-secondary">
          이전
        </button>
        <button onClick={onNext} className="btn btn-primary">
          다음 단계
        </button>
      </div>
    </div>
  );
};

export default DataPreview;