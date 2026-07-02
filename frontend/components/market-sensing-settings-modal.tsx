"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface KeywordTag {
  id: string
  text: string
}

export default function MarketSensingSettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("widgets")
  const [keywordTags, setKeywordTags] = useState<KeywordTag[]>([
    { id: "1", text: "민원접수" },
    { id: "2", text: "고객보호" }
  ])
  const [keywordInput, setKeywordInput] = useState("")

  // 위젯 설정 상태
  const [widgetSettings, setWidgetSettings] = useState({
    newsAlert: false,
    newsMentions: 100,
    twitterAlert: true,
    twitterRank: 5,
    dramAlert: true,
    dramChange: 5,
    exportAlert: false,
    exportChange: 10,
    autoAlert: false,
    autoChange: 15,
    shipAlert: false,
    shipChange: 5,
    passengerAlert: false,
    passengerChange: 20
  })

  // 알림 설정 상태
  const [alertSettings, setAlertSettings] = useState({
    portalPopup: true,
    email: true,
    sms: false,
    volumeCondition: 300,
    priceAlert: false
  })

  const addKeywordTag = () => {
    if (keywordInput.trim() && !keywordTags.some(tag => tag.text === keywordInput.trim())) {
      const newTag: KeywordTag = {
        id: Date.now().toString(),
        text: keywordInput.trim()
      }
      setKeywordTags(prev => [...prev, newTag])
      setKeywordInput("")
    }
  }

  const removeKeywordTag = (id: string) => {
    setKeywordTags(prev => prev.filter(tag => tag.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeywordTag()
    }
  }

  const handleSave = () => {
    alert("설정이 저장되었습니다.")
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[55vw] h-[75vh] overflow-hidden flex flex-col" style={{ maxWidth: 'none', width: '55vw' }}>
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="widgets" className="text-sm">대시보드 위젯 편집</TabsTrigger>
            <TabsTrigger value="alerts" className="text-sm">상세 알림 설정</TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto">
            {/* 탭 1: 대시보드 위젯 편집 */}
            <TabsContent value="widgets" className="space-y-4 mt-0">
              <p className="text-xs text-gray-600 mb-4">대시보드에 표시할 업무 지표와 기본 알림 조건을 설정하세요.</p>
              
              <div className="space-y-4">
                {/* 실시간/뉴스 섹션 */}
                <div>
                  <h3 className="font-semibold text-base mb-3">실시간/업무 이슈</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* 뉴스 트렌드 카드 */}
                    <Card className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-newspaper text-gray-400"></i>
                          <h4 className="font-semibold">민원 접수 트렌드</h4>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <Label>알림 활성화</Label>
                          <Switch 
                            checked={widgetSettings.newsAlert}
                            onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, newsAlert: checked }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <Label>언급량</Label>
                          <div className="flex items-center space-x-1">
                            <span>&gt;</span>
                            <Input 
                              type="number" 
                              value={widgetSettings.newsMentions}
                              onChange={(e) => setWidgetSettings(prev => ({ ...prev, newsMentions: parseInt(e.target.value) || 0 }))}
                              className="w-12 text-center border rounded-md p-0.5 h-6" 
                            />
                            <span className="text-gray-400">건/시간</span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* 트위터(X) 키워드 카드 */}
                    <Card className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <i className="fab fa-twitter text-gray-400"></i>
                          <h4 className="font-semibold">운영 키워드</h4>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <Label>알림 활성화</Label>
                          <Switch 
                            checked={widgetSettings.twitterAlert}
                            onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, twitterAlert: checked }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <Label>급상승 순위</Label>
                          <div className="flex items-center space-x-1">
                            <span>≤</span>
                            <Input 
                              type="number" 
                              value={widgetSettings.twitterRank}
                              onChange={(e) => setWidgetSettings(prev => ({ ...prev, twitterRank: parseInt(e.target.value) || 0 }))}
                              className="w-12 text-center border rounded-md p-0.5 h-6" 
                            />
                            <span className="text-gray-400">위</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* 산업/섹터별 데이터 섹션 */}
                <div>
                  <h3 className="font-semibold text-base mb-3">업무 데이터 지표</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* 상담 완료율 카드 */}
                    <Card className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-memory text-gray-400"></i>
                          <h4 className="font-semibold">상담 완료율</h4>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <Label>알림 활성화</Label>
                          <Switch 
                            checked={widgetSettings.dramAlert}
                            onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, dramAlert: checked }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <Label>일간 변동률</Label>
                          <div className="flex items-center space-x-1">
                            <span>≥</span>
                            <Input 
                              type="number" 
                              value={widgetSettings.dramChange}
                              onChange={(e) => setWidgetSettings(prev => ({ ...prev, dramChange: parseInt(e.target.value) || 0 }))}
                              className="w-12 text-center border rounded-md p-0.5 h-6" 
                            />
                            <span className="text-gray-400">%</span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* 민원 해결률 카드 */}
                    <Card className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-truck text-gray-400"></i>
                          <h4 className="font-semibold">민원 해결률</h4>
                        </div>
                        <Checkbox />
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <Label>알림 활성화</Label>
                          <Switch 
                            checked={widgetSettings.exportAlert}
                            onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, exportAlert: checked }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <Label>전주대비</Label>
                          <div className="flex items-center space-x-1">
                            <span>≥</span>
                            <Input 
                              type="number" 
                              value={widgetSettings.exportChange}
                              onChange={(e) => setWidgetSettings(prev => ({ ...prev, exportChange: parseInt(e.target.value) || 0 }))}
                              className="w-12 text-center border rounded-md p-0.5 h-6" 
                            />
                            <span className="text-gray-400">%</span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* 채권양수도 추론 요청 카드 */}
                    <Card className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-car text-gray-400"></i>
                          <h4 className="font-semibold">채권양수도 추론 요청 수</h4>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <Label>알림 활성화</Label>
                          <Switch 
                            checked={widgetSettings.autoAlert}
                            onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, autoAlert: checked }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <Label>전일대비</Label>
                          <div className="flex items-center space-x-1">
                            <span>≥</span>
                            <Input 
                              type="number" 
                              value={widgetSettings.autoChange}
                              onChange={(e) => setWidgetSettings(prev => ({ ...prev, autoChange: parseInt(e.target.value) || 0 }))}
                              className="w-12 text-center border rounded-md p-0.5 h-6" 
                            />
                            <span className="text-gray-400">%</span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* 협약기관 조회 카드 */}
                    <Card className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-ship text-gray-400"></i>
                          <h4 className="font-semibold">협약기관 조회량</h4>
                        </div>
                        <Checkbox />
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <Label>알림 활성화</Label>
                          <Switch 
                            checked={widgetSettings.shipAlert}
                            onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, shipAlert: checked }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <Label>절대값 변동</Label>
                          <div className="flex items-center space-x-1">
                            <span>&gt;</span>
                            <Input 
                              type="number" 
                              value={widgetSettings.shipChange}
                              onChange={(e) => setWidgetSettings(prev => ({ ...prev, shipChange: parseInt(e.target.value) || 0 }))}
                              className="w-12 text-center border rounded-md p-0.5 h-6" 
                            />
                            <span className="text-gray-400">pt</span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* 업무담당자 검색 카드 */}
                    <Card className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-plane text-gray-400"></i>
                          <h4 className="font-semibold">업무담당자 검색량</h4>
                        </div>
                        <Checkbox />
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <Label>알림 활성화</Label>
                          <Switch 
                            checked={widgetSettings.passengerAlert}
                            onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, passengerAlert: checked }))}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <Label>전월대비</Label>
                          <div className="flex items-center space-x-1">
                            <span>≥</span>
                            <Input 
                              type="number" 
                              value={widgetSettings.passengerChange}
                              onChange={(e) => setWidgetSettings(prev => ({ ...prev, passengerChange: parseInt(e.target.value) || 0 }))}
                              className="w-12 text-center border rounded-md p-0.5 h-6" 
                            />
                            <span className="text-gray-400">%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 탭 2: 상세 알림 설정 */}
            <TabsContent value="alerts" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* 급등/관심 키워드 알림 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">급등/관심 키워드 알림</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="font-semibold block mb-2 text-sm">키워드 등록</Label>
                        <div className="border rounded-md p-2 min-h-[100px] bg-white">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {keywordTags.map((tag) => (
                              <Badge key={tag.id} variant="default" className="flex items-center gap-1">
                                <span>{tag.text}</span>
                                <button
                                  type="button"
                                  onClick={() => removeKeywordTag(tag.id)}
                                  className="hover:bg-blue-700 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <Input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="키워드 입력 후 Enter"
                            className="border-none shadow-none focus-visible:ring-0 p-0 text-sm"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          등록된 키워드의 언급량이 급증할 경우 알림을 받습니다.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 전역(공통) 알림 설정 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">전역(공통) 알림 설정</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="font-semibold block mb-2 text-sm">알림 수신 매체 (다중 선택)</Label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 text-sm">
                            <Checkbox 
                              checked={alertSettings.portalPopup}
                              onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, portalPopup: checked as boolean }))}
                            />
                            <span>포탈 팝업</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Checkbox 
                              checked={alertSettings.email}
                              onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, email: checked as boolean }))}
                            />
                            <span>이메일</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Checkbox 
                              checked={alertSettings.sms}
                              onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, sms: checked as boolean }))}
                            />
                            <span>문자(SMS)</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 운영 지표 상세 조건 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">운영 지표 상세 조건 (예시)</CardTitle>
                    <CardDescription className="text-sm">
                      '위젯 편집'에서 활성화된 항목에 대해 아래 조건을 추가로 적용할 수 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="font-semibold block mb-2 text-sm">문의량 조건</Label>
                      <div className="flex items-center space-x-2 text-sm">
                        <span>전일 대비</span>
                        <Input 
                          type="number" 
                          value={alertSettings.volumeCondition}
                          onChange={(e) => setAlertSettings(prev => ({ ...prev, volumeCondition: parseInt(e.target.value) || 0 }))}
                          className="w-20 text-center border rounded-md"
                        />
                        <span>% 이상 증가 시</span>
                      </div>
                    </div>
                    <hr />
                    <div>
                      <Label className="font-semibold block mb-2 text-sm">운영 이상 징후 조건</Label>
                      <div className="flex items-center justify-between text-sm">
                        <span>임계치 초과 시 알림</span>
                        <Switch 
                          checked={alertSettings.priceAlert}
                          onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, priceAlert: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleSave}>
            설정 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
